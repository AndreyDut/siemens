import app from 'app';
import $ from 'jquery';
import 'js/siswru-sync-array.directive';
import modelPropertyService from 'js/modelPropertyService';
import "js/aw-label.directive";

app.directive( 'siswruSyncArrayContainer', [
    '$timeout', 
    function( $timeout ) {
        return {
            restrict: 'E',
            scope: {
                props: '=',
                modifiable:'<'
            },
            templateUrl: app.getBaseUrlPath() + '/html/siswru-sync-array-container.directive.html',
            link: function($scope, $element) {
                if($scope.props && $scope.props[0]) {
                    if($scope.modifiable == undefined) {
                        $scope.modifiable = true;
                    } else {
                        if(typeof $scope.modifiable == 'string') {
                            switch ($scope.modifiable) {
                                case 'true':
                                    $scope.modifiable = true;
                                    break;
                                case 'false':
                                    $scope.modifiable = false;
                                    break;
                                default:
                                    $scope.modifiable = false;
                                    throw new Error('invalid is modifiable value');
                            }
                        }
                    }

                    $scope.syncArrayIsEditable = function() {
                        let result = true;
                        $scope.props.forEach(item => {
                            if(!item.isEditable) {                           
                                result = false; 
                            }
                        }); 
                        return result;
                    };
                        
                    $scope.props[0].syncArrayFirst = true;
                    $scope.props.forEach(item => item.syncArray = true);

                    if($scope.$parent.data && $scope.$parent.data.objCreateInfo) {
                        $scope.props.forEach(({propertyName}) => {
                            $scope.$parent.data.objCreateInfo.propNamesForCreate.push(propertyName);
                        });                   
                    }

                    if($scope.props[$scope.props.length - 1]) {
                        $scope.props[$scope.props.length - 1].syncArrayButtonAnchor = true;
                    } else {
                        $scope.props[0].syncArrayButtonAnchor = true;
                    }
                }
               
                $scope.$on( '$destroy', function() {
                    $element.remove();
                    $element.empty();
                } );
            }
        }
    }
]);