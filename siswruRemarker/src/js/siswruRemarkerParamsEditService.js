import {siswSoaCallWrapper, loadObjectWithProps, updateTargetStatus} from 'js/siswruRemarkerUtils'
import dateTimeService from 'js/dateTimeService'
import cdm from 'soa/kernel/clientDataModel';
import eventBus from 'js/eventBus';
import _ from 'lodash'
import {configObj, getParamNameFromPref} from 'js/siswruRemarkerPrefService';

export async function updateProperiesHandler(remarksData, targetsContainer){
    //kd name changed impact save
    await kdNameChangedCaseSave(targetsContainer)
    //update manualy changed params
    await updateChangedParams(remarksData)
    await updateApproveResult(targetsContainer)
    //load real nkRemarks
    const uidsToForget = targetsContainer.map(i => i.NkRemark.uid)
    cdm.removeObjects(uidsToForget)
}

//kd name changed case
async function kdNameChangedCaseSave(targetsContainer){
    const updateArray = targetsContainer.filter(i => i.changed || i.copied || i.removed)
    const nkRemaksArray = []
    updateArray.forEach(({NkRemark}) => {
        nkRemaksArray.push({
            uid: NkRemark.uid,
            NkRemark,
            props: configObj.arrays.NkRemarkParams
        })
    })

    const info = createSoaUpdateInput(nkRemaksArray)
    console.log(info)
    if(info.length){
        await siswSoaCallWrapper("Core-2010-09-DataManagement", "setProperties",{info, options:[]})
    }
}

async function updateChangedParams(remarksData){
 const updateArray = []
    remarksData.forEach(card => {
        for(const [key, prop] of Object.entries(card.rowProps)){
            if (prop.valueUpdated && prop.propertyName !== getParamNameFromPref("KDName")) {
                
                card.NkRemark.props[prop.propertyName].dbValues[card.propArrayIndex] = prop.dbValue

                let item = updateArray.find(obj => obj.uid === card.NkRemark.uid)

                if(item){
                    const contProperty = item.props.find(p => p === prop.propertyName)
                    if(!contProperty) {
                        item.props.push(prop.propertyName)
                    }
                } else{
                    item = {
                        uid: card.NkRemark.uid,
                        NkRemark: card.NkRemark,
                        props: [prop.propertyName]
                    }
                    updateArray.push(item)
                }
                if(prop.propertyName === getParamNameFromPref("Decision") && prop.dbValue){
                    updateModDate(card, item)
                }               
            }
        }
    });
    const info = createSoaUpdateInput(updateArray)
    if(info.length){
        await siswSoaCallWrapper("Core-2010-09-DataManagement", "setProperties",{info, options:[]})
    }
}

function updateModDate(card, item){
    if(!item.props.includes(getParamNameFromPref("Last_Change_Date"))){
        item.props.push(getParamNameFromPref("Last_Change_Date"),
            getParamNameFromPref("Answering_Role"),
            getParamNameFromPref("Answering_User")
        )
    }
    //name
    card.NkRemark.props[getParamNameFromPref("Answering_User")].dbValues[card.propArrayIndex] = card.access.User1.currentUserName
    //role
    card.NkRemark.props[getParamNameFromPref("Answering_Role")].dbValues[card.propArrayIndex] = card.access.User1.currentUserRole
    //date
    card.NkRemark.props[getParamNameFromPref("Last_Change_Date")].dbValues[card.propArrayIndex] = dateTimeService.formatUTC(Date.now())
}

function createSoaUpdateInput(updateArray){
    const info= []
    updateArray.forEach(item => {
        let container = {
            object: item.NkRemark,
            vecNameVal:[],
            timestamp:null
        }
        item.props.forEach(prop =>{
            container.vecNameVal.push({
                name: prop,
                values: container.object.props[prop].dbValues.map(val => (val === null)? "" : val)
            })
        })
        info.push(container)
    })
    return info
}

export function updateApprove(prop, cardData){
    if(prop.dbValue && prop.dbValue !=cardData.rowProps[getParamNameFromPref("Approve")].dbValue){
        cardData.rowProps[getParamNameFromPref("Approve")].dbValue = prop.dbValue
        cardData.rowProps[getParamNameFromPref("Approve")].valueUpdated = true           
    }
}

export function updateKDName(prop, cardData){
    if(prop.dbValue && prop.dbValue !=cardData.rowProps[getParamNameFromPref("KDName")].dbValue){
        cardData.rowProps[getParamNameFromPref("KDName")].dbValue = prop.dbValue
        eventBus.publish( 'siswruKDNameChanged', {updateKDpropValue: prop.dbValue,updateKDcardData: cardData} );            
    }
}

export function updateCodeTest(prop, cardData){
    if(prop.dbValue && prop.dbValue !=cardData.rowProps[getParamNameFromPref("KDName")].dbValue){
        cardData.rowProps[getParamNameFromPref("KDName")].dbValue = prop.dbValue
        cardData.rowProps[getParamNameFromPref("Decision")].dbValue = "Test Decision"
        eventBus.publish( 'siswruCodeTestChanged', {updateCodepropValue: prop.dbValue,updateCodecardData: cardData} );            
    }
}

export async function KDNameChangedHandler(remarksData, targetsContainer, cardData, propValue){

    //get new target
    const newTarget = cardData.config.targets.targetsList.find(item => item.id ==propValue).object
       
    //check if nkremark exists
    let sameTargetRow = remarksData.find(item => item.target !== null && item.target.uid === newTarget.uid)
    let newPropArrayIndex
    let newNkRemark = {}
    if(sameTargetRow){
        //exists       
        newNkRemark = sameTargetRow.NkRemark
        newPropArrayIndex = newNkRemark.props[getParamNameFromPref("Answering_Role")].dbValues.length
    } else {
        newNkRemark = (await loadObjectWithProps([newTarget.props[cardData.config.internal.NkRemarkRelationType.RelationType.value].dbValues[0]]))[0]
        newPropArrayIndex = 0
    }           
        for(const propName of cardData.config.arrays.NkRemarkParams){
            //put props to new nkremark
            newNkRemark.props[propName].dbValues.push(cardData.rowProps[propName].dbValue)
            //delete from old
            if(cardData.NkRemark){
                cardData.NkRemark.props[propName].dbValues = cardData.NkRemark.props[propName].dbValues.filter((_, index) => index !== cardData.propArrayIndex)
            }                
        }
        //update propArrayIndex for other rows
        if(cardData.NkRemark){
            for(const card of remarksData){
                if(card.NkRemark.uid === cardData.NkRemark.uid && card.propArrayIndex > cardData.propArrayIndex){
                    card.propArrayIndex--
                }
            }
        }
        if(cardData.NkRemark) updateTargetStatus(targetsContainer, cardData.NkRemark.uid, "changed")
        updateTargetStatus(targetsContainer, newNkRemark.uid, "changed")
        
        cardData.NkRemark = newNkRemark
        cardData.propArrayIndex = newPropArrayIndex
        cardData.target = newTarget
        
        cardData.access = _.cloneDeep(cardData.access)
        cardData.access.User1.status = (cardData.target.props.owning_user.dbValues[0] === cardData.access.User1.currentUserUid) ? true : false
        console.log(remarksData)
}

export async function CodeTestChangedHandler(remarksData, targetsContainer, cardData, propValue){

    //get new target
    const newTarget = cardData.config.targets.targetsList.find(item => item.id ==propValue).object
       
    //check if nkremark exists
    let sameTargetRow = remarksData.find(item => item.target !== null && item.target.uid === newTarget.uid)
    let newPropArrayIndex
    let newNkRemark = {}
    if(sameTargetRow){
        //exists       
        newNkRemark = sameTargetRow.NkRemark
        newPropArrayIndex = newNkRemark.props[getParamNameFromPref("Answering_Role")].dbValues.length
    } else {
        newNkRemark = (await loadObjectWithProps([newTarget.props[cardData.config.internal.NkRemarkRelationType.RelationType.value].dbValues[0]]))[0]
        newPropArrayIndex = 0
    }           
        for(const propName of cardData.config.arrays.NkRemarkParams){
            //put props to new nkremark
            newNkRemark.props[propName].dbValues.push(cardData.rowProps[propName].dbValue)
            //delete from old
            if(cardData.NkRemark){
                cardData.NkRemark.props[propName].dbValues = cardData.NkRemark.props[propName].dbValues.filter((_, index) => index !== cardData.propArrayIndex)
            }                
        }
        //update propArrayIndex for other rows
        if(cardData.NkRemark){
            for(const card of remarksData){
                if(card.NkRemark.uid === cardData.NkRemark.uid && card.propArrayIndex > cardData.propArrayIndex){
                    card.propArrayIndex--
                }
            }
        }
        if(cardData.NkRemark) updateTargetStatus(targetsContainer, cardData.NkRemark.uid, "changed")
        updateTargetStatus(targetsContainer, newNkRemark.uid, "changed")
        
        cardData.NkRemark = newNkRemark
        cardData.propArrayIndex = newPropArrayIndex
        cardData.target = newTarget
        
        cardData.access = _.cloneDeep(cardData.access)
        cardData.access.User1.status = (cardData.target.props.owning_user.dbValues[0] === cardData.access.User1.currentUserUid) ? true : false
        console.log(remarksData)
}
async function updateApproveResult(targetsContainer){
    const updateArray = []
    for(let container of targetsContainer){
        const nkRemark = container.NkRemark
        let item = {
            target:container.target, 
            NkRemark: nkRemark,
            prop: getParamNameFromPref("ApproveResult"),
            status: ""
        }
        updateArray.push(item)
        const approve = nkRemark.props[getParamNameFromPref("Approve")].dbValues
        if (approve.length === 0){
            continue
        }
        if(!approve.includes("0")){
            //checked
            item.status = "Checked"
            continue
        }
        const notes = nkRemark.props[getParamNameFromPref("Notes")].dbValues.filter(i => i)
        const decision = nkRemark.props[getParamNameFromPref("Decision")].dbValues.filter(i => i)
        if(notes.length === decision.length){
            //not checked
            item.status = "Not Checked"
            continue
        }
        if(decision.length === 0){
            //only notes
            item.status = "Only notes"
            continue
        } else {
            //No answered
            item.status = "No answered"
            continue
        }
    }
    await updateApproveResultSoa(updateArray)
}

async function updateApproveResultSoa(updateArray){
    const info = updateArray.flatMap(i =>{
        const length = i.NkRemark.props[getParamNameFromPref("Approve")].dbValues.length
        return [
            {
                object: i.NkRemark,
                vecNameVal:[{
                    name: i.prop,
                    values: Array(length).fill(i.status)
                }],
                timestamp: null
            }
            // },
            // {
            //     object: i.target,
            //     vecNameVal:[{
            //         name: i.prop,
            //         values: [i.status]
            //     }],
            //     timestamp: null
            // }
        ]
    })
    await siswSoaCallWrapper("Core-2010-09-DataManagement", "setProperties",{info, options:[]})
}
