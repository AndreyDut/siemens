import _ from 'lodash'
import dateTimeService from 'js/dateTimeService'
import {getParamNameFromPref, configObj} from 'js/siswruRemarkerPrefService'
import eventBus from 'js/eventBus';
import {updateTargetStatus} from 'js/siswruRemarkerUtils'

export function addCard(data, remarksData, emptyCard){
    emptyCard.propArrayIndex++
    const newCard = {...emptyCard }
    newCard.rowProps = _.cloneDeep(emptyCard.rowProps)
    remarksData.push(newCard)
    //update filter
    if(data.filteredRows){
        data.filteredRows.push(newCard)
    } else{
        data.filteredRows = [newCard]
    }
    
}

export function copyCard(data, card, remarksData){
    const newCard = {
        target: card.target,
        NkRemark: card.NkRemark,
        access: _.cloneDeep(card.access),
        config: card.config,
        propArrayIndex: card.NkRemark.props[getParamNameFromPref("User")].dbValues.length,
        rowProps: _.cloneDeep(card.rowProps)
    }
    dropRemarkParams(newCard)
    for(const propName of card.config.arrays.NkRemarkParams){
        newCard.NkRemark.props[propName].dbValues.push(newCard.rowProps[propName].dbValue)
    }    
    remarksData.push(newCard)
    //update filter
    data.filteredRows.push(newCard)
    updateTargetStatus(data.targetsContainer, newCard.NkRemark.uid, "copied")
}
export function removeCard(data, card, remarksData, filterIndex){
    if(card.NkRemark){
        for(const propName of card.config.arrays.NkRemarkParams){
            if(card.NkRemark){
                card.NkRemark.props[propName].dbValues = card.NkRemark.props[propName].dbValues.filter((_, index) => index !== card.propArrayIndex)
            }
        }
    }
    let index = 0
    if(card.NkRemark){
        index =  remarksData.findIndex(c => c.NkRemark.uid === card.NkRemark.uid && c.propArrayIndex === card.propArrayIndex)        
    } else {
        index = remarksData.findIndex(c => c.NkRemark === null && c.propArrayIndex === card.propArrayIndex)
    }
    remarksData = remarksData.filter((_, i) => i !== index)
    console.log(remarksData)
    data.remarksData = remarksData
    //update filter
    data.filteredRows.splice(filterIndex, 1)
    if(card.NkRemark) updateTargetStatus(data.targetsContainer, card.NkRemark.uid, "removed")
}

function dropRemarkParams(newCard){
    newCard.access.remarkOwnerName = newCard.access.User1.currentUserName
    newCard.access.remarkOwnerRole = newCard.access.User1.currentUserRole
    newCard.access.User1.status = true

    newCard.rowProps[getParamNameFromPref("User")].dbValue = newCard.access.User1.currentUserName
    newCard.rowProps[getParamNameFromPref("UserRole")].dbValue = newCard.access.User1.currentUserRole
    newCard.rowProps[getParamNameFromPref("Create_Date")].dbValue = dateTimeService.formatUTC(Date.now())
    newCard.rowProps[getParamNameFromPref("Answering_User")].dbValue = ""
    newCard.rowProps[getParamNameFromPref("Answering_Role")].dbValue = ""
    newCard.rowProps[getParamNameFromPref("Decision")].dbValue = ""
    newCard.rowProps[getParamNameFromPref("Last_Change_Date")].dbValue = ""
    newCard.rowProps[getParamNameFromPref("Approve")].dbValue = "0"

    newCard.rowProps[getParamNameFromPref("User")].uiValue = newCard.access.User1.currentUserName
    newCard.rowProps[getParamNameFromPref("UserRole")].uiValue = newCard.access.User1.currentUserRole
    newCard.rowProps[getParamNameFromPref("Create_Date")].uiValue = dateTimeService.formatDate(Date.now())
    newCard.rowProps[getParamNameFromPref("Answering_User")].uiValue = ""
    newCard.rowProps[getParamNameFromPref("Answering_Role")].uiValue = ""
    newCard.rowProps[getParamNameFromPref("Decision")].uiValue = ""
    newCard.rowProps[getParamNameFromPref("Last_Change_Date")].uiValue = ""
}