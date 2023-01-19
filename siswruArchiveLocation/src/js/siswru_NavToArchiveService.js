/**
 * Simple Alert service for sample command Handlers
 *
 * @module js/siswru_NavToArchiveService
 */

 import soaSvc from 'soa/kernel/soaService';
 import navigationUtils from 'js/navigationUtils';

export let getStates = function() {
    var stateSvc = navigationUtils.getState();
    console.log(stateSvc.get().find(item => item.name == "siswruToolBook"));
    console.log(stateSvc.get().find(item => item.name == "showMyDashboard"));
    stateSvc.go("siswruToolBook",{}, {inherit: false})
} 
/**
 * 
 */
 export let defaultAWSTextSearch = async function(filter, objType, myLimit) {

    let objectType = [objType];
    if(!filter) {
        filter = "*"
    }
    
    let input ={
        columnConfigInput: {
            clientName: "AWClient",
            clientScopeURI: "Awp0ObjectNavigation"
        },
        inflateProperties:false,
        searchInput:{
            cursor:{
                startIndex: 0
            },
            internalPropertyName:"",
            maxToLoad: myLimit,
            maxToReturn: myLimit,
            providerName: "Awp0FullTextSearchProvider",
            searchCriteria:{
                forceThreshold: "true",
                limitedFilterCategoriesEnabled: "false",
                listOfExpandedCategories: "",
                searchString: filter
            },
            searchFilterFieldSortType: "Priority",
            searchFilterMap:{               
                'WorkspaceObject.object_type':[
                    {
                        searchFilterType:"StringFilter",
                        stringValue: objectType
                    }
                ],
            }
        }
    }
    let searchResult = await soaSvc.post( 'Internal-AWS2-2018-05-Finder', 'performSearchViewModel3', input );
    let modelObjects = JSON.parse(searchResult.searchResultsJSON);
    console.log(modelObjects);
    return {
        objects: modelObjects.objects,
        totalFound: searchResult.totalFound > myLimit ? myLimit: searchResult.totalFound
    }
}

export let setSearchInput = function(searchInput) {
    return searchInput ? searchInput : "*"
}
export let setSearchType = function(type) {
    return type;
}

export default {
    defaultAWSTextSearch,
    getStates,
    setSearchInput,
    setSearchType
};
