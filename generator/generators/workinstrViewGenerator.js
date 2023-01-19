/* eslint-env es6 */

const generatorUtils = require( 'afx/build/js/generator' );
const logger = require( 'afx/build/js/logger' );

const messages = {
    description: 'Generates a workinstrView. A workinstrView is a gallery view within EWI solution.',
    nameInputMsg: logger.infoColor( '\nGive the view a name. This is a unique identifier used by the build system.\n' ) + 'View name: ',
    titleInputMsg: logger.infoColor( '\nGive the view a title. The title will be the displayed tab name\n' ) + 'View title: ',
    viewModeInputMsg: logger.infoColor( `\nChoose the view mode. Available modes are:\n ${logger.nameColor( 'Gallery' )}\n ${logger.nameColor( 'Table' )}\n ${logger.nameColor( 'List' )}\n\n` ) + 'View mode: ',
    configPreferenceNameInputMsg: logger.infoColor( '\nGive the view config preference name. This is the preference name where the view content is configured\n' ) + 'View config preference name: ',
    showThumbnailsInputMsg: logger.infoColor( `\nShould thumbnails be displayed? Options are:\n ${logger.nameColor( 'yes' )}\n ${logger.nameColor( 'no' )}\n\n` ) + 'Show thumbnails: ',
    columnConfigPreferenceNameInputMsg: logger.infoColor( '\nGive the column config preference name. This is the preference name where the table columns are configured\n' ) + 'Column config preference name: ',
    propertyNameInputMsg: logger.infoColor( '\nGive the propery name that has the objects list to display\n' ) + 'Property name: ',
    typeNameInputMsg: logger.infoColor( '\nGive the object type of the objects in the list to display\n' ) + 'Type name: '
};

module.exports.name = 'workinstrView';
module.exports.description = 'Generates a zero compile workinstr gallery view within EWI solution.';
module.exports.execute = function() {
    let getName = function( x ) {
        return x.name;
    };
    let concat = function( a, b ) {
        return a.concat( b );
    };
    return generatorUtils.getModule().then( function( targetModuleJson ) {
        //Build workinstrViewModel in module.json if necessary
        if( !targetModuleJson.workinstrViewModel ) {
            targetModuleJson.workinstrViewModel = {};
        }

        //Ensure it has all the necessary properties
        [ 'views', 'i18n' ].map( function( key ) {
            if( !targetModuleJson.workinstrViewModel[ key ] ) {
                targetModuleJson.workinstrViewModel[ key ] = {};
            }
        } );

        if( !targetModuleJson.workinstrViewModel.preferences ) {
            targetModuleJson.workinstrViewModel.preferences = [];
        }

        let workinstrViewModel = targetModuleJson.workinstrViewModel;
        let isValidWorkinstrViewName = function( input ) {
            if( workinstrViewModel.views[ input ] ) {
                logger.warn( `WorkinstrView with name ${logger.nameColor( input )} already exists` );
                return false;
            }
            return input;
        };
        return generatorUtils.getUserInput( '-n', messages.nameInputMsg, isValidWorkinstrViewName ).then( function( name ) {
            return generatorUtils.getUserInput( '-title', messages.titleInputMsg ).then( function( title ) {
                const i18nId = title + 'Title';

                //Add the i18n
                workinstrViewModel.i18n[ i18nId ] = [ targetModuleJson.name + 'Messages' ];

                return generatorUtils.getUserInput( '-viewMode', messages.viewModeInputMsg ).then( function( viewMode ) {

                    if( viewMode === 'List' || viewMode === 'Table' ) { // List or Table view

                        return generatorUtils.getUserInput( '-columnConfigPreferenceName', messages.columnConfigPreferenceNameInputMsg ).then( function( columnConfigPreferenceName ) {
                            return generatorUtils.getUserInput( '-propertyName', messages.propertyNameInputMsg ).then( function( propertyName ) {
                                return generatorUtils.getUserInput( '-typeName', messages.typeNameInputMsg ).then( function( typeName ) {

                                    const viewModeVal = name + viewMode;
                                    const tableViewVal = name + 'Table';
                                    const listViewVal = name + 'List';

                                    const filesToCreate = {
                                        '__workinstrView-name__TableViewModel.json': {
                                            dir: 'src/viewmodel/'
                                        },
                                        '__workinstrView-name__TableView.html': {
                                            dir: 'src/html/'
                                        },
                                        '__workinstrView-name__ListViewModel.json': {
                                            dir: 'src/viewmodel/'
                                        },
                                        '__workinstrView-name__ListView.html': {
                                            dir: 'src/html/'
                                        }
                                    };

                                    //Add the view
                                    workinstrViewModel.views[ name ] = {
                                        title: i18nId,
                                        columnConfigPreferenceName: columnConfigPreferenceName,
                                        typeName: typeName,
                                        runtimePropertyName: propertyName,
                                        tableView: tableViewVal,
                                        listView: listViewVal,
                                        viewMode: viewModeVal
                                    };

                                    //Add the preference
                                    workinstrViewModel.preferences.push( columnConfigPreferenceName );

                                    let messages = {};
                                    messages[ i18nId ] = title;

                                    let placeholder2Value = {
                                        '__workinstrView-name__': name,
                                        '__module-name__': targetModuleJson.name
                                    };

                                    return Promise.all( [ generatorUtils.writeBuildJson( targetModuleJson ),
                                        generatorUtils.createFiles( targetModuleJson, filesToCreate, placeholder2Value ),
                                        generatorUtils.updateModuleMessages( targetModuleJson, messages, {} )
                                    ] ).then( function() {
                                        logger.info( `Created workinstrView ${logger.nameColor(name)} in module ${logger.nameColor(targetModuleJson.name)}` );
                                    } );
                                } );
                            } );
                        } );

                    }  // Gallery view
                        return generatorUtils.getUserInput( '-configPreferenceName', messages.configPreferenceNameInputMsg ).then( function( configPreferenceName ) {
                            return generatorUtils.getUserInput( '-showThumbnails', messages.showThumbnailsInputMsg ).then( function( showThumbnails ) {

                                const showThumbnailsVal = showThumbnails === 'no' ? 'false' : 'true';

                                //Add the view
                                workinstrViewModel.views[ name ] = {
                                    title: i18nId,
                                    configPreferenceName: configPreferenceName,
                                    viewMode: 'workinstrGallery',
                                    showThumbnails: showThumbnailsVal
                                };

                                //Add the preference
                                workinstrViewModel.preferences.push( configPreferenceName );

                                let messages = {};
                                messages[ i18nId ] = title;

                                return Promise.all( [ generatorUtils.writeBuildJson( targetModuleJson ),
                                    generatorUtils.updateModuleMessages( targetModuleJson, messages, {} )
                                ] ).then( function() {
                                    logger.info( `Created workinstrView ${logger.nameColor(name)} in module ${logger.nameColor(targetModuleJson.name)}` );
                                } );
                            } );
                        } );
                    
                } );
            } );
        } );
    } );
};
