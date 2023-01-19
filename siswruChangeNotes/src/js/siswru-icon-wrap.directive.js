import * as app from 'app';

app.directive( 'siswruIconWrap',  function() {
    return {
        restrict: 'A',
        scope:{},
        link: function( $scope, element) {
            element.on('click', function(event){
                const target = event.target
                if(target.nodeName === "svg"){
                    return
                }
                event.preventDefault()
                event.stopPropagation()  
                const clickevent = new MouseEvent('click', {
                    view: window,
                    bubbles: false,
                    cancelable: true
                });
                var child = element.find( 'button' )[0]
                child.dispatchEvent(clickevent)
            })
        }
    }
})