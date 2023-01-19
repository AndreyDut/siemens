import cdm from 'soa/kernel/clientDataModel';
import dms from 'soa/dataManagementService';
import soaService from 'soa/kernel/soaService';
import messagingService from 'js/messagingService';
import _ from 'lodash'
import {configObj} from 'js/siswruRemarkerPrefService';

export function checkIsNullContains(arr){
    let str = "empty pref "
    let err = false
    for(const item of arr){
        if (!item.value){
            err = true
            str+= item.name + ", "
        }
    }
    if(err) {
        return str
    } else{
        return null
    }
}
export function checkContainsProps(obj, props){
    let str = "can't find property "
    let err = false
    for(const prop of props){
        if (!obj.props.hasOwnProperty(prop)){
            err = true
            str+= prop+ ", "
        }
    }
    if(err) {
        return str
    } else{
        return null
    }
}

export async function loadObjectWithProps(uids, props){
    await dms.loadObjects(uids)       
    const turgetsWithRem = await cdm.getObjects(uids)
    if(props){
        await dms.getProperties(uids, props)
        const err = checkContainsProps(turgetsWithRem[0], props)
        if (err) throw new Error(err)
    }   
    return turgetsWithRem
}

export async function siswSoaCallWrapper(serviceName, operationName, body){
    return soaService.post( serviceName, operationName, body)
         .catch( (err) => {
             messagingService.showError(err.message);
             throw err;
         } );
 }

export function createNewNkRemark(cardData){
    const NkRemark = cardData.NkRemark
    const newNkRemark = _.cloneDeep(NkRemark)
    for(const propName of cardData.config.arrays.NkRemarkParams){
        newNkRemark.props[propName].dbValues = []
    }
    return newNkRemark
}

export async function createNkRelation(uid){
    //create nk
    const nkMo = await createNkRemarkBo();
    //create relation
    const resp = await soaService.post('Core-2006-03-DataManagement', 'createRelations', {
        input: [
            {
                primaryObject: {uid},
                secondaryObject:{uid: nkMo.uid},
                relationType:configObj.internal.NkRemarkRelationType.RelationType.value
            }
        ]
    });
    console.log(resp)
    return nkMo
}

export async function createNkRemarkBo(){
    const input ={
        inputs:[
            {
                clientId:"CreateObject",
                createData:{
                    boName: configObj.internal.NkRemarkType.Type.value,
                    compoundCreateInput:{                       
                    },
                    propertyNameValues:{
                        object_name:["Замечания"],
                        object_desc:["Замечания"]
                    }
                },
                dataToBeRelated:{},
                pasteProp:"",
                targetObject:null,
                workflowData:{}
            }
        ]
    }
    const createResp = await soaService.post('Core-2016-09-DataManagement', 'createAttachAndSubmitObjects', input);
    const nkRemarkUId = createResp.ServiceData.created[0]
    const mo = createResp.ServiceData.modelObjects[nkRemarkUId]
    return mo
}
export function updateTargetStatus(targetsContainer, uid, reason){
    const item = targetsContainer.find(i => i.NkRemark.uid == uid)
    item[reason] = true
}