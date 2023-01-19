import cdm from 'soa/kernel/clientDataModel';
import dms from 'soa/dataManagementService';
import soaService from 'soa/kernel/soaService';
import {getConfigFromPref, getParamNameFromPref} from 'js/siswruRemarkerPrefService'
import messagingService from 'js/messagingService';
import {loadObjectWithProps} from 'js/siswruRemarkerUtils'
import tcVMOService from 'js/tcViewModelObjectService'
import _ from 'lodash'
import uwPropertyService from 'js/uwPropertyService'
import sessionCtxSvc from 'js/sessionContext.service'
import {getTargetObjects, getObjectInternalName, getObjectDispName} from 'js/siswruRemarkerSourceService'
import {createNkRelation} from 'js/siswruRemarkerUtils'
import dateTimeService from 'js/dateTimeService'


let config ={}
let currentUserInfo = {}

export async function loadRemarks(ctx, showUtility){
        config = await getConfigFromPref()

        const {err, data: targets} = await getTargetObjects(ctx.xrtSummaryContextObject)
        if (err) {
            messagingService.showError(err)
            return
        }
        const targetUids = targets.uids

        currentUserInfo = getCurrentUserInfo(ctx)
        
        config.targets = targets.targets

        //get targets with props

        const turgetsWithRem = await loadObjectWithProps(targetUids, [...config.arrays.NkRemarkRelation, 'owning_user'])
        //create main object
        const data = turgetsWithRem.map(item => ({
            target: item
        }))
        //get remarks with props
        for(const item of data) {
            await getTargetAdditionalData(item)
        }

        const targetsContainer = []
        for(const item of data){
            targetsContainer.push({
                NkRemark: item.NkRemark,
                target: item.target, 
            })
        }

        let {rowsArray, emptyCard} = formatGlobalRowsArray(data, ctx)
        if(rowsArray.length){
            rowsArray = rowsArray.sort((a,b) => a.rowProps[getParamNameFromPref("Approve")].dbValue > b.rowProps[getParamNameFromPref("Approve")].dbValue)
        }
        
        console.log(rowsArray)

        showUtility.dbValue = true
        return {
            remarksData: rowsArray,
            targetsContainer,
            emptyCard
        }
}

function getCurrentUserInfo(ctx){
    return {
        groupDisplayName: ctx.userSession.props.group_name.displayValues[0],
        group: ctx.userSession.props.group_name.dbValue,
        roleDisplayName: ctx.userSession.props.role_name.displayValues[0],
        role: ctx.userSession.props.role_name.dbValue
    }
}

async function getTargetAdditionalData(item){
    let NkRemUids = item.target.props[config.arrays.NkRemarkRelation[0]].dbValues
    if(!NkRemUids.length){
        const nk = await createNkRelation(item.target.uid)
        NkRemUids = [nk.uid]
    }
    const NkRemWithProps = await loadObjectWithProps(NkRemUids, config.arrays.NkRemarkParams)
    const NkRemark = NkRemWithProps.filter(item => item.type = config.arrays.NkRemarkType[0])
    if(NkRemark && NkRemark.length > 0) {
        item.NkRemark = NkRemark[0]
        item.NkRemarkVMO = await tcVMOService.createViewModelObjectById(item.NkRemark.uid)
        await createRowArray(item)
    }
    item.IsNotApproved = await getTargetNotApproveStatus(item.target)
}

async function getTargetNotApproveStatus(target){
    const statusUid = target.props.release_status_list.dbValues
    if(statusUid.length){
        const statuses = await loadObjectWithProps(statusUid, ['name'])
        statuses.forEach(status =>{
            if(status.props.name.dbValues[0] == 'Approved'){
                return false
            }
        })
    }
    return true
}

async function createRowArray(item){
    let filteredProps = {}
    const NkRemarkArray = []
    for (const [key, value] of Object.entries(item.NkRemarkVMO.props)) {
        if(config.arrays.NkRemarkParams.includes(key)){
            filteredProps[key] = value 
        }
    }
    for(let i= 0; i < filteredProps[config.arrays.NkRemarkParams[0]].dbValues.length; i++){
        let row = _.cloneDeep(filteredProps)
        for (const [key, value] of Object.entries(row)) {
            transformProperty(value, i)           
        }
        NkRemarkArray.push(row)
    }
    item.NkRemarkArray = NkRemarkArray
    //get empty card
    const emptyProps = getEmptyProps(filteredProps)
    item.emptyProps = emptyProps
}
function formatGlobalRowsArray(data, ctx){
    let rowsArray =[]
    for(const item of data){
        for(let i=0; i< item.NkRemarkArray.length; i++){
            let outRow = {
                rowProps:item.NkRemarkArray[i],
                NkRemark: item.NkRemark,
                target: item.target,
                config,
                access: getRemarkAccessStatus(item.target, item.NkRemarkArray[i], ctx, item.IsNotApproved),
                propArrayIndex: i
            }
            rowsArray.push(outRow)
        }
    }
    const emptyCard = getEmptyCard(data[0], ctx)
    return {rowsArray, emptyCard}
}
function getEmptyProps(filteredProps){
    let row = _.cloneDeep(filteredProps)
    for (const [key, prop] of Object.entries(row)) {
        prop.isArray = false
        if (prop.type.includes("ARRAY")){
            prop.type = prop.type.slice(0,-5)
        }  
        if(prop.type === "STRING"){
            prop.dbValue = ""
            prop.uiValue = ""
        } else {
            prop.dbValue = null
            prop.uiValue = null
        }       
        prop.isEditable = true
    }
    return row
}
function getEmptyCard(item, ctx){
    item.emptyProps[getParamNameFromPref("User")].dbValue = ctx.user.props.user_name.dbValue
    item.emptyProps[getParamNameFromPref("UserRole")].dbValue = currentUserInfo.roleDisplayName
    item.emptyProps[getParamNameFromPref("Create_Date")].dbValue = dateTimeService.formatUTC(Date.now())

    item.emptyProps[getParamNameFromPref("User")].uiValue = ctx.user.props.user_name.dbValue
    item.emptyProps[getParamNameFromPref("UserRole")].uiValue = currentUserInfo.roleDisplayName
    item.emptyProps[getParamNameFromPref("Create_Date")].uiValue = dateTimeService.formatDate(Date.now())
    const newCard = {
        target: null,
        NkRemark: null,
        access: getRemarkAccessStatus(null, item.emptyProps, ctx, item.IsNotApproved),
        config,
        propArrayIndex:0,
        rowProps: item.emptyProps
    }
    return newCard
}
function transformProperty(prop, i){
    prop.isArray = false
    if (prop.type.includes("ARRAY")){
        prop.type = prop.type.slice(0,-5)
    }  

    if(prop.dbValue[i] === null){
        if(prop.type === "STRING"){
            prop.dbValue = ""
            prop.uiValue = ""
        } else {
            prop.dbValue = null
            prop.uiValue = null
        }       
    } else{
        prop.dbValue = prop.dbValues[i]
        prop.uiValue = prop.uiValues[i]              
    }
    prop.isEditable = true   
}

function getRemarkAccessStatus(target,rowParams, ctx, IsNotApproved){
    let output = {
        User1: {
            status: !target ? true : (target.props.owning_user.dbValues[0] === ctx.user.uid) ? true : false,
            currentUserName: ctx.user.props.user_name.dbValue,
            currentUserUid: ctx.user.uid,
            currentUserRole: currentUserInfo.roleDisplayName,
            currentUserGroup: currentUserInfo.groupDisplayName,
            compareValue: currentUserInfo.group + ":" + currentUserInfo.role
        },
        User2: config.internal.access.User2,
        User3: config.internal.access.User3,
        remarkOwnerName: rowParams[getParamNameFromPref("User")].dbValue,
        remarkOwnerRole: rowParams[getParamNameFromPref("UserRole")].dbValue,
        delete: config.internal.access.delete.value[0],
        IsNotApproved
    }
    return output
}


export function createCardDataProperties(data, subCtx){
    for (const [key, value] of Object.entries(subCtx.config.internal.NkRemarkParams)) {
        const propName = value.value
        switch (key){
            case "Approve":
                data.Approve.dbValue = subCtx.rowProps[propName].dbValue
                data.Approve.uiValue = (data.Approve.dbValue === '1') ? 'Да' : 'Нет'
                break
            case "KDName":
                if(subCtx.target){
                    data.KDName.dbValue = getObjectInternalName(subCtx.target)
                    data.KDName.uiValue = getObjectDispName(subCtx.target)
                } else{
                    data.KDName.dbValue = ""
                    data.KDName.uiValue = ""
                }                
                break
            //!!!!костыль убрать
            case "Notes":
                subCtx.rowProps[propName].propertyDisplayName = 'Замечание'
                data[key] = subCtx.rowProps[propName]
                break
            default:
                data[key] = subCtx.rowProps[propName]
        }       
    }
}

export function cleanData(targetsContainer){
    if(targetsContainer){
        const uidsToForget = []
        targetsContainer.forEach( i => {
            uidsToForget.push(i.NkRemark.uid) 
        })
        cdm.removeObjects(uidsToForget)
    }
    currentUserInfo = {}
    config = {}
}