import testCK from 'ckeditor'


const serfSym1SVG = `<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" version="1.1">
<line y2="22" x2="12.7" y1="11" x1="6.3" stroke="#000"></line>
<line stroke="#000" y2="22" x2="12.7" y1="6" x1="24"></line>      
</svg>`
const sym1SVG = `<svg width="48" height="24" xmlns="http://www.w3.org/2000/svg" version="1.1" enable-background="new 0 0 24 24" xml:space="preserve">
<g>
 <title>Layer 1</title>
 <path stroke="#000" id="svg_6" d="m47.46997,20.94956l0,-17.63196l-47.44443,17.63196l47.44443,0z" fill="#000000"/>
 <path stroke="#000" id="svg_7" d="m0.2029,2.71838l0,18.05785l47.87033,-18.05785l-47.87033,0z" fill="none"/>
 <line stroke="#000" id="svg_9" y2="24.02721" x2="23.72743" y1="20.79042" x1="23.72743" fill="none"/>
 <line id="svg_10" y2="-0.07832" x2="23.72743" y1="2.73258" x1="23.72743" stroke="#000" fill="none"/>
</g>
</svg>`

//APPLICATION
//config.extraPlugins = [InsertSerf, ESKDSymb]
//config.toolbar.push('insertImage', 'symbGroup')
export class InsertSerf extends testCK.Plugin {
    static get requires() {
        return [ testCK.Widget ];
    }
    _defineSchema() {
        const schema = this.editor.model.schema;
        schema.register( 'serfWrapMain', {
            isObject: true,
            allowWhere: '$text',
            isInline: true,
        })
        schema.register( 'serfWrap', {
            isLimit: true,
            isInline: true,
            allowIn: 'serfWrapMain',
            allowContentOf: '$block'
        })
        schema.register( 'serfUp', {
            isLimit: true,
            allowIn: 'serfWrap',
            allowContentOf: '$block'
        })
        schema.register( 'serfDown', {
            isLimit: true,
            allowIn: 'serfWrap',
            allowContentOf: '$block'
        } );
        schema.register( 'typeIcon', {
            allowIn: 'serfWrapMain',
            isLimit: true
        } );
    }
    _defineConverters() {
        const conversion = this.editor.conversion;

        conversion.for( 'upcast' ).elementToElement( {
            model: 'serfWrapMain',
            view: {
                name: 'span',
                classes: 'siswru-serf-wrap-main'
            }
        } );
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'serfWrapMain',
            view: {
                name: 'span',
                classes: 'siswru-serf-wrap-main'
            }
        } );
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'serfWrapMain',
            view: ( modelElement, { writer: viewWriter } ) => {
                const section = viewWriter.createContainerElement( 'span', { class: 'siswru-serf-wrap-main' } );

                return testCK.toWidget( section, viewWriter, { label: 'simple box widget' } );
            }
        } );

        conversion.for( 'upcast' ).elementToElement( {
            model: 'serfWrap',
            view: {
                name: 'span',
                classes: 'siswru-serf-wrap-col'
            }
        } );
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'serfWrap',
            view: {
                name: 'span',
                classes: 'siswru-serf-wrap-col'
            }
        } );
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'serfWrap',
            view: ( modelElement, { writer: viewWriter } ) => {
                const section = viewWriter.createContainerElement( 'span', { class: 'siswru-serf-wrap-col' } );

                return section//testCK.toWidget( section, viewWriter, { label: 'simple box widget' } );
            }
        } );

        conversion.for( 'upcast' ).elementToElement( {
            model: 'serfUp',
            view: {
                name: 'span',
                classes: 'siswru-serf-text-up'
            }
        } );
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'serfUp',
            view: {
                name: 'span',
                classes: 'siswru-serf-text-up'
            }
        } );
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'serfUp',
            view: ( modelElement, { writer: viewWriter } ) => {
                const h1 = viewWriter.createEditableElement( 'span', { class: 'siswru-serf-text-up' } );

                return testCK.toWidgetEditable( h1, viewWriter );
            }
        } );
        
        conversion.for( 'upcast' ).elementToElement( {
            model: 'serfDown',
            view: {
                name: 'span',
                classes: 'siswru-serf-text-down'
            }
        } );
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'serfDown',
            view: {
                name: 'span',
                classes: 'siswru-serf-text-down'
            }
        } );
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'serfDown',
            view: ( modelElement, { writer: viewWriter } ) => {
                // Note: You use a more specialized createEditableElement() method here.
                const div = viewWriter.createEditableElement( 'span', { class: 'siswru-serf-text-down' } );

                return testCK.toWidgetEditable( div, viewWriter );
            }
        } );
        conversion.for( 'upcast' ).elementToElement( {
            model: 'typeIcon',
            view: {
                name:'img',
                class:'siswru-serf-icon'
            }
        } );
        conversion.for( 'downcast' ).elementToElement( {
            model: 'typeIcon',
            view: ( modelElement, { writer: viewWriter } ) => {
                const b64 = 'data:image/svg+xml;base64,'+window.btoa(serfSym1SVG);
                const icon = viewWriter.createContainerElement( 'img', { class:"siswru-serf-icon", src:b64 } );
                return icon                              
            }
        } );
    }
    init() {
        this._defineSchema()
        this._defineConverters();

        const editor = this.editor;
        const cmdInsertImage24 = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n\t viewBox="0 0 24 24" enable-background="new 0 0 24 24" xml:space="preserve">\n\t<path class="aw-theme-iconOutline" fill="#464646" d="M3,7.5C3,8.9,4.1,10,5.5,10S8,8.9,8,7.5S6.9,5,5.5,5S3,6.1,3,7.5z M7,7.5C7,8.3,6.3,9,5.5,9S4,8.3,4,7.5\n\t\tS4.7,6,5.5,6S7,6.7,7,7.5z"/>\n\t<path class="aw-theme-iconOutline" fill="#464646" d="M13.4,11.5l3.3-5.3l2.1,3c0.2,0.2,0.5,0.3,0.7,0.1c0.2-0.2,0.3-0.5,0.1-0.7l-2.9-4.2l-3.4,5.3l-2.6-3.5\n\t\tL3.6,16.7c-0.1,0.1-0.1,0.2-0.1,0.3H1V3h20v7h1V2H0v16h9v-1H4.6l6.2-9L13.4,11.5z"/>\n\t<path class="aw-theme-iconOutline" fill="#464646" d="M17.5,11c-3.6,0-6.5,2.9-6.5,6.5c0,3.6,2.9,6.5,6.5,6.5c3.6,0,6.5-2.9,6.5-6.5C24,13.9,21.1,11,17.5,11z\n\t\t M17.5,23c-3,0-5.5-2.5-5.5-5.5c0-3,2.5-5.5,5.5-5.5c3,0,5.5,2.5,5.5,5.5C23,20.5,20.5,23,17.5,23z"/>\n\t<polygon class="aw-theme-iconOutline" fill="#464646" points="21,17 18,17 18,14 17,14 17,17 14,17 14,18 17,18 17,21 18,21 18,18 21,18 \t"/>\n</svg>\n';
        editor.ui.componentFactory.add( 'insertImage', locale => {
            const view = new testCK.ButtonView( locale );

            view.set( {
                label: 'Insert image',
                icon: cmdInsertImage24,
                tooltip: true
            } );

            // Callback executed once the image is clicked.
            view.on( 'execute', () => {
                console.log('click')
                this.editor.model.change( writer => {
                   this.editor.model.insertContent(this._createSerfBox(writer))
                } );
            } );

            return view;
        } );
    }
    _createSerfBox(writer){
        const mainBox = writer.createElement( 'serfWrapMain' );
        const simpleBox = writer.createElement( 'serfWrap' );
        const icon = writer.createElement( 'typeIcon' );

        writer.append( icon, mainBox );
        writer.append( simpleBox, mainBox );

        const simpleBoxTitle = writer.createElement( 'serfUp' );
        const simpleBoxDescription = writer.createElement( 'serfDown' );
        writer.append( simpleBoxTitle, simpleBox );
        writer.append( simpleBoxDescription, simpleBox );
        return mainBox;
    }
}

export  class ESKDSymb extends testCK.Plugin{   
    _defineSchema(){
        const schema = this.editor.model.schema;
        schema.register( 'symbWrap', {
            isObject: true,
            allowWhere: '$text',
            isInline: true,
        })
        schema.register( 'symb1', {
            allowIn: 'symbWrap',
            isLimit: true
        }) 
    }

    _defineConverters(){
        const conversion = this.editor.conversion;

        conversion.for( 'upcast' ).elementToElement( {
            model: 'symbWrap',
            view: {
                name:'span',
                class:'siswru-serf-simb-wrap'
            }
        } );
        conversion.for( 'downcast' ).elementToElement( {
            model: 'symbWrap',
            view: ( modelElement, { writer: viewWriter } ) => {
                const wrap = viewWriter.createContainerElement( 'span', { class:"siswru-serf-simb-wrap" } );
                return wrap                              
            }
        } );

        conversion.for( 'upcast' ).elementToElement( {
            model: 'symb1',
            view: {
                name:'img',
                class:'siswru-serf-symb'
            }
        } );
        conversion.for( 'downcast' ).elementToElement( {
            model: 'symb1',
            view: ( modelElement, { writer: viewWriter } ) => {
                const b64 = 'data:image/svg+xml;base64,'+window.btoa(sym1SVG);
                const icon = viewWriter.createContainerElement( 'img', { class:"siswru-serf-symb", src:b64 } );
                return icon                              
            }
        } );       
    }
    _getDropdownItemsDefinitions(){
        const itemDefinitions = new testCK.Collection();

        const definition = {
            type: 'button',
            model: new testCK.Model( {
                label: 'symb1',
                withText: true,
                id:'symb1'
            } )
        };

        // Add the item definition to the collection.
        itemDefinitions.add( definition );

    return itemDefinitions;
    }
    _insertSymb(writer, name){
        const symb = writer.createElement( name )
        const wrap = writer.createElement( 'symbWrap' )
        writer.append( symb, wrap )
        return wrap
    }
    init() {
        this._defineSchema()
        this._defineConverters();

        const editor = this.editor;
        const t = editor.t;

        editor.ui.componentFactory.add( 'symbGroup', locale => {
            const dropdownView = testCK.createDropdown( locale );
            testCK.addListToDropdown( dropdownView, this._getDropdownItemsDefinitions(  ) );
            dropdownView.buttonView.set( {
                label: 'symboles',
                withText: true
            } );

            dropdownView.on( 'execute', ( eventInfo ) => {
                const { id, label } = eventInfo.source;
                if(id === 'symb1'){
                    console.log(id)
                    this.editor.model.change( writer => {
                        this.editor.model.insertContent(this._insertSymb(writer,'symb1'))
                     } );
                }
            })
            return dropdownView;
        })
    }
}