import prefService from 'soa/preferenceService'
import soaService from 'soa/kernel/soaService';
import {checkIsNullContains} from 'js/siswruRemarkerUtils'
import sessionCtxSvc from 'js/sessionContext.service'

const NkRemarkTypePref = ["SPLMRU_Remark_Object_Type"]
const NkRemarkRelationTypePref = ["SPLMRU_Remark_Relation_Type"]

const NkRemarkPropPrefs = [
    "SPLMRU_Remark_Answering_Role",
    "SPLMRU_Remark_Answering_User",
    "SPLMRU_Remark_Approve_Property",
    "SPLMRU_Remark_Code_Property",
    "SPLMRU_Remark_Create_Date",
    "SPLMRU_Remark_Decision_Property",
    "SPLMRU_Remark_KDName_Property",
    "SPLMRU_Remark_Last_Change_Date",
    "SPLMRU_Remark_Notes_Property",
    "SPLMRU_Remark_User_Property",
]

export const configObj = {
    internal:{
        NkRemarkType:{
            Type:{
                prefName: "SPLMRU_Remark_Object_Type"
            }            
        },
        NkRemarkRelationType:{
            RelationType:{
                prefName:"SPLMRU_Remark_Relation_Type"
            }           
        },
        NkRemarkParams:{
            Answering_Role: {
                prefName:"SPLMRU_Remark_Answering_Role",
                value:""
            },
            Answering_User:{
                prefName:"SPLMRU_Remark_Answering_User",
                value:""
            },
            Approve:{
                prefName:"SPLMRU_Remark_Approve_Property",
                value:""
            },
            Code:{
                prefName: "SPLMRU_Remark_Code_Property",
                value:""
            },
            Create_Date:{
                prefName:"SPLMRU_Remark_Create_Date",
                value:""
            },
            Decision:{
                prefName:"SPLMRU_Remark_Decision_Property",
                value:""
            },
            KDName:{
                prefName:"SPLMRU_Remark_KDName_Property",
                value:""
            },
            Last_Change_Date:{
                prefName:"SPLMRU_Remark_Last_Change_Date",
                value:""
            },
            Notes:{
                prefName:"SPLMRU_Remark_Notes_Property",
                value:""
            },
            User:{
                prefName:"SPLMRU_Remark_User_Property",
                value:""
            },
            UserRole:{
                prefName:"SPLMRU_Remark_Remarker_Role",
                value:""
            }
        },
        NkApproveResult:{
            prefName:"SPLMRU_Remark_Approve_Result_Property",
            value:""
        },
        access:{
            User1:{
                prefName:"",
                value:null
            },
            User2:{
                prefName:"SPLMRU_edit_notes_role_in_group_1",
                value:null
            },
            User3:{
                prefName:"SPLMRU_edit_notes_role_in_group_2",
                value:null
            },
            delete:{
                prefName:"SPLMRU_Remark_Delete_Notes_Mode",
                value:null
            }
        }
    },
    arrays:{
        NkRemarkType:[],
        NkRemarkRelation:[],
        NkRemarkParams:[]
    },
}

export function getParamNameFromPref(name){
    if(name !== 'ApproveResult'){
        return configObj.internal.NkRemarkParams[name].value
    }
    return configObj.internal.NkApproveResult.value
}

export async function getConfigFromPref(){
    configObj.arrays.NkRemarkType = await getConfigParams(configObj.internal.NkRemarkType)   
    configObj.arrays.NkRemarkRelation = await getConfigParams(configObj.internal.NkRemarkRelationType)
    configObj.internal.NkApproveResult.value = await getApproveResult()
    configObj.arrays.NkRemarkParams = await getConfigParams(configObj.internal.NkRemarkParams)
    await getAccessRights()
    return configObj
}

async function getConfigParams(names){
    let resp = await getPrefValues(names)
    const err = checkIsNullContains(resp)
    if(err) {
        throw new Error(err)
    }
    return resp.map(item => item.value)
}

async function getPrefValues(obj){
    const names = []
    for (const [key, value] of Object.entries(obj)) {
        names.push(value.prefName)
    }

    let resp = await soaService.post('Administration-2012-09-PreferenceManagement', 'getPreferences', {
        preferenceNames: names,
        includePreferenceDescriptions: false})
    const output = resp.response.map(item => ({
        name: item.definition.name,
        value:item.values.values[0] 
    }))

    //update config fields
    for (const [key, value] of Object.entries(obj)) {
        const pref = output.find(item => item.name == value.prefName)
        value.value = pref.value
    }
    return output
}

export async function getAccessRights(){
    for (const [key, user] of Object.entries(configObj.internal.access)) {
        if(user.prefName){
            let resp = await soaService.post('Administration-2012-09-PreferenceManagement', 'getPreferences', {
                preferenceNames: [user.prefName],
                includePreferenceDescriptions: false
            })
            user.value = resp.response[0].values.values
        }
    }
}
export async function getUtilityPref(){
    let resp = await soaService.post('Administration-2012-09-PreferenceManagement', 'getPreferences', {
        preferenceNames: ["SPLMRU_Remark_Allow_Utility"],
        includePreferenceDescriptions: false
    })
    resp = resp.response[0].values.values
    const output = {}
    resp.forEach(i =>{
        const rec = i.split(':')
        if(!output[rec[1]]) {
            output[rec[1]] = [rec[0]]
        } else {
            output[rec[1]].push(rec[0])
        }
    })
    return output
}
async function getApproveResult(){
    let resp = await soaService.post('Administration-2012-09-PreferenceManagement', 'getPreferences', {
        preferenceNames: [configObj.internal.NkApproveResult.prefName],
        includePreferenceDescriptions: false
    })
    return resp.response[0].values.values[0]
}