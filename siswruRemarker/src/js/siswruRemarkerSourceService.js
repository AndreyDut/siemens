import {loadObjectWithProps} from 'js/siswruRemarkerUtils'
import {getUtilityPref} from 'js/siswruRemarkerPrefService'
import {configObj} from 'js/siswruRemarkerPrefService'
import soaService from 'soa/kernel/soaService';

const ALLOWED_TYPES = ['SPD5_ChangeNotRevision', 'SPB5_AssyRevision', 'SPB5_DetRevision', 'SPB5_DocRevision']

export async function getTargetObjects(obj){
    if (obj.modelType.typeHierarchyArray.includes('Awb0Element')){
        const archUid = obj.props.awb0Archetype.dbValues
        obj = (await loadObjectWithProps(archUid))[0]
    }
    switch (obj.type){
        case "EPMDoTask":
            return getFromWF(obj)
        case "SPD5_ChangeNotRevision":
            return getFromCN(obj)
        case "SPB5_AssyRevision":
        case "SPB5_DetRevision":
        case "SPB5_DocRevision":
            return getFromDSE(obj)
        default:
            return getOutput("для данного типа объекта утилита недоступна")
    }
}

async function getFromWF(obj){
    const wfs = await loadObjectWithProps([obj.uid], ["root_target_attachments", "parent_task"])
    const types = await getUtilityStatus(wfs[0].props["parent_task"].uiValues[0])
    if (!types) return getOutput("Для данного процесса утилита недоступна")
    
    let targets = await loadObjectWithProps(wfs[0].props.root_target_attachments.dbValues, ["item_id", "item_revision_id", 'release_status_list'])

    targets = targets.filter(item => types.includes(item.type))
    if(targets.length){
        return getOutput(null, targets)
    } else {
        return getOutput("Цели процесса отсутствуют")
    }

}

function getOutput(err, targets){
    return {
        err,
        data:{
            uids: (targets && targets.length) ? targets.map(item => item.uid) : null,
            targets: (targets && targets.length) ? getTargetsNames(targets) : null
        }
    }
}

async function getUtilityStatus(taskTemplateName){
    const pref = await getUtilityPref();
    if(pref[taskTemplateName]) return pref[taskTemplateName]
    return null
}

function getTargetsNames(targets){
    const targetsDP = targets.map(item => ({
        propDisplayValue: getObjectDispName(item),
        propInternalValue: getObjectInternalName(item)
    }))
    const targetsList =  targets.map(item => ({
        id: getObjectInternalName(item),
        object: item
    }))
    return {
        targetsDP,
        targetsList
    }
}
export function getObjectDispName(item){
    return (item.props.item_id.dbValues.length && item.props.item_id.dbValues[0]) ? item.props.item_id.dbValues[0] + '-'+ item.props.object_name.dbValues[0] : item.props.object_name.dbValues[0]
}
export function getObjectInternalName(item){
    const first = (item.props.item_id.dbValues.length && item.props.item_id.dbValues[0]) ? item.props.item_id.dbValues[0] : item.props.object_name.dbValues[0]
    return first +'/'+ item.props.item_revision_id.dbValues[0]
}

async function checkUtilityStatusByProcess(targets){
    const utilPref = await getUtilityPref()
    for(const processName of targets[0].props.process_stage_list.dbValues){
        if (utilPref[processName] && utilPref[processName].includes(targets[0].type)){
            return true
        }
    }
    return false
}

async function getFromDSE(obj){
    //release_status_list свойство у ДСЕ
    // в нем массив объектов типа releaseStatus 
    // выгрузить объекты, у них поле name(c маленькой буквы)
    //имя должно быть Approved

    //есть форма nkRemarks
    const targets = await loadObjectWithProps([obj.uid], [...configObj.arrays.NkRemarkRelation, 'process_stage_list', 'release_status_list', "item_id", "item_revision_id"])
    //check nkRemark
    const nkRemarkUids = targets[0].props[configObj.arrays.NkRemarkRelation[0]].dbValues  
    if(nkRemarkUids.length){
        return getOutput(null, targets)
    }
    //check process list
    const stByProcess = await checkUtilityStatusByProcess(targets)
    if (stByProcess) return getOutput(null, targets, 'obj')
        
    return getOutput("Для данного объекта утилита неприменима")
}

async function getFromCN(changeNote){
    const changeNoteWithProp = await loadObjectWithProps([changeNote.uid], [...configObj.arrays.NkRemarkRelation,'process_stage_list'])
    const nkRemarkUids = changeNoteWithProp[0].props[configObj.arrays.NkRemarkRelation[0]].dbValues  
    if(!nkRemarkUids.length){
        const stByProcess = await checkUtilityStatusByProcess(changeNoteWithProp)
        if (!stByProcess) return getOutput("Для данного объекта утилита неприменима")
    }

    const arr = [1,2]
    const arr2 = arr.flatMap(i => {return [2,1]} )

    const resp = await soaService.post("Helper-2018-11-ChangeManagement", "getCNData", {changeNoticeRevisions: [{uid: changeNote.uid}]})
    const objects = resp.relationDataMap[1][0]
    const uids = [changeNote.uid]
    for(const item of objects){
        if(item.relationInfo.relationTypeName === "CMHasSolutionItem"){
            uids.push(...item.attachmentData.map(i => i.attachment.uid))
        }
    }
    let targets = await loadObjectWithProps(uids, [...configObj.arrays.NkRemarkRelation, 'process_stage_list', 'release_status_list', "item_id", "item_revision_id"])
    targets = targets.filter(t => ALLOWED_TYPES.includes(t.type))
    console.log(targets)
    return getOutput(null, targets)
}