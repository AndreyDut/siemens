import uwPropertySrv from "js/uwPropertyService"
import _ from "lodash"
import {configObj, getParamNameFromPref} from 'js/siswruRemarkerPrefService'
const propsArray = [
    "User",
    "Code",
    "KDName",
    "UserRole",
    "Create_DateFrom",
    "Create_DateTo",
    "Approve"
]
const DEFAUT_DATE = -62135605800000

let realPropsNames = []

export function initFiltrationInfo(rowsArray, ctx){
    const config = configObj
    //get filters names
    realPropsNames = getFiltersNames(config)
    //form dataProviders
    const filterDPs = {}
    realPropsNames.forEach((p,i) =>{
        filterDPs[propsArray[i]] = getDocFilter(rowsArray, p)
    })

    //values
    const filterValues={}
    if(!ctx.siswruRemarksFiltation){
        for(let [key, val] of Object.entries(filterDPs)){
            const index = propsArray.indexOf(key)
            if((key.endsWith("To")) || (key.endsWith("From"))) {
                filterValues[key] = {
                    dbValue:"",
                    realName: realPropsNames[index]
                }
            } else {
                filterValues[key] = {
                    dbValue:[],
                    realName: realPropsNames[index]
                }
            }        
        }
    }
    if(!ctx.siswruRemarksFiltation){
        ctx.siswruRemarksFiltation= {
            enable: true,
            filterDPs,
            filterValues
        }
    } else {
        ctx.siswruRemarksFiltation.filterDPs = filterDPs
        ctx.siswruRemarksFiltation.enable = true
    }
    
}

export function updateDPs(ctx,rowsArray){
    //get filters names
    realPropsNames = getFiltersNames(configObj)
    //form dataProviders
    const filterDPs = {}
    realPropsNames.forEach((p,i) =>{
        filterDPs[propsArray[i]] = getDocFilter(rowsArray, p)
    })
    ctx.siswruRemarksFiltation.filterDPs = filterDPs
}

export function getFiltrationInfo(ctx, data){   
    for (let [key, val] of Object.entries(ctx.siswruRemarksFiltation.filterValues)){
        data[key].dbValue= val.dbValue
        if((key.endsWith("To")) || (key.endsWith("From"))) {
            uwPropertySrv.updateDisplayValues(data[key], val.dbValue)
        } else {
            uwPropertySrv.updateDisplayValues(data[key], [...val.dbValue])
        }        
    }  
}
export function cleanFilter(ctx, data){
    for (let [key, val] of Object.entries(ctx.siswruRemarksFiltation.filterValues)){
        
        if((key.endsWith("To")) || (key.endsWith("From"))) {
            val.dbValue = DEFAUT_DATE
            data[key].dbValue= val.dbValue
            uwPropertySrv.updateDisplayValues(data[key], DEFAUT_DATE)
            data[key].dateApi.dateValue = ""
        } else {
            val.dbValue = []
            data[key].dbValue= val.dbValue
            uwPropertySrv.updateDisplayValues(data[key], [...val.dbValue])
        }        
    } 
}

function getDocFilter(rowsArray, propName){
    const set = new Set()
    for(const row of rowsArray){
        set.add(row.rowProps[propName].dbValue)
    }
    const output =[]
    set.forEach(item => {
        let out = {
            propInternalValue: item,
            propDisplayValue: (item && propName === getParamNameFromPref("KDName")) ? configObj.targets.targetsDP.find(t => t.propInternalValue === item).propDisplayValue : item
        }
        output.push(out)
    })
    return output
}

function getFiltersNames(config){
    return propsArray.map(p => {
        if (p.endsWith("To")) return config.internal.NkRemarkParams[p.slice(0, -2)].value
        if (p.endsWith("From")) return config.internal.NkRemarkParams[p.slice(0, -4)].value
        return config.internal.NkRemarkParams[p].value
    }) 
}

export function applyFilter(rowsArray, ctx){
    const filteredRows = []
    const validFilters = []
    propsArray.forEach((fProp, index) => {
        if((fProp.endsWith("To") || fProp.endsWith("From")) && ctx.siswruRemarksFiltation.filterValues[fProp].dbValue && ctx.siswruRemarksFiltation.filterValues[fProp].dbValue != DEFAUT_DATE) {
            validFilters.push({
                real: realPropsNames[index],
                internal: fProp
            })
        } else {
            if (ctx.siswruRemarksFiltation.filterValues[fProp].dbValue.length) validFilters.push({
                real: realPropsNames[index],
                internal: fProp
            })
        }   
    })

    if (validFilters.length){
        for (const card of rowsArray){
            let ok = true
            for (let prop of validFilters) {
                if (prop.internal.endsWith("From")){
                    let numbDate = Date.parse(card.rowProps[prop.real].dbValue)
                    if (numbDate < ctx.siswruRemarksFiltation.filterValues[prop.internal].dbValue) ok = false
                    continue
                }
                if (prop.internal.endsWith("To")){
                    let numbDate = Date.parse(card.rowProps[prop.real].dbValue)
                    if (numbDate > ctx.siswruRemarksFiltation.filterValues[prop.internal].dbValue) ok = false
                    continue
                }                
                if(!ctx.siswruRemarksFiltation.filterValues[prop.internal].dbValue.includes(card.rowProps[prop.real].dbValue)) ok = false
            }
            if (ok) filteredRows.push(card)
        }
        console.log(filteredRows)
        return {filteredRows}
    }
    return {filteredRows:[...rowsArray]}
}

export function dateUpdate(ctx, name, value){
    if (value !== null && ctx.siswruRemarksFiltation.filterValues[name].dbValue != value) ctx.siswruRemarksFiltation.filterValues[name].dbValue = value
}
export function disableFilter(ctx){
    if(ctx.siswruRemarksFiltation){
        ctx.siswruRemarksFiltation.enable = false;
    }
}

export function cleanData(ctx){
    if(ctx.siswruRemarksFiltation){
        delete ctx.siswruRemarksFiltation       
    }
    realPropsNames = []
}