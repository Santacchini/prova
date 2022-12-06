sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment"

],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, filter , filterOperator, ODataModel, JSONModel, MessageBox,Fragment,) {
        "use strict";

        return Controller.extend("ui5.ui.controller.Master", {
            onInit: function () {
                this.onAjaxSearch();
                sap.ui.getCore().setModel(new JSONModel([{
                    "type": "Parody"
                    }, {
                    "type": "Drama"
                    },{
                    "type": "Horror"
                    }, {
                    "type": "Fantasy"
                    },{
                    "type": "Romance"
                    },{
                    "type": "Mystery"
                    },{
                    "type": "Comedy"
                    },{
                    "type": "Fiction"
                    }]),'Genre');

                    this.getOwnerComponent().getRouter().getRoute("RouteMaster").attachPatternMatched(this.onNavigationMatched,this)
             }, 

             onNavigationMatched: function(oEevent){
                
                this.getView().byId("genre").setValue(null);
                
             },

            onInserisci: function () {
                this.getOwnerComponent().getRouter().navTo("Inserisci");

            },

            onSearch: function () {
                var bookName = this.getView().byId("bookName").getValue();
                var filters = [];
                if(bookName != ''){ 
                    filters.push(new filter("title",filterOperator.EQ,bookName));
                }
                var odataModel = new ODataModel("/ui5ui/Odata/odata/v2/AdminService/");
                this.getView().setBusy(true);
                odataModel.read("/Books",{
                    async : true,
                    filters : filters,
                    success : function(oResults){
                        oResults.results.map(item => item.isEdit = false);
                        this.getView().setModel(new JSONModel(oResults.results),"Books");
                        this.getView().setBusy(false);
                    }.bind(this),
                    error : function(oError){
                        MessageBox.error("Errore del servizio.")
                        this.getView().setBusy(false);
                    }.bind(this),

                });
            },
            onDelete: (oEvent)=>{
                let obj = oEvent.getSource().getBindingContext("Books").getObject();
                MessageBox.confirm("Sicuro di procedere?",{
                    onClose: function(oAction){
                        if(oAction === 'OK'){
                            var odataModel = new ODataModel("/ui5ui/Odata/odata/v2/AdminService/");
                            odataModel.remove("/Books(guid'"+obj.ID+"')", {
                                async : true,
                                success : function(oResults){
                                    MessageBox.success("Libro cancellato");
                                    that.onSearch();
                                },
                                error: function(oError){
                                    MessageBox.error("Errore del servizio!");
                                }
                            });
                        }
                    }
                });
            },
            onEdit: function(oEvent) {
                var obj = oEvent.getSource().getBindingContext("Books").getObject();
                obj.isEdit = true;
                this.getView().getModel("Books").refresh();
            },
            onSave: function (oEvent) {
                var obj = oEvent.getSource().getBindingContext("Books").getObject();
                var that = this;
                var odataModel = new ODataModel("/ui5ui/Odata/odata/v2/AdminService/");
                odataModel.update("/Books(guid'" + obj.ID + "')", {
                    "title": obj.title                }, {
                    async: true,
                    success: function (oResults) {
                        that.onSearch();
                    },
                    error: function (oError) {
                        MessageBox.error("Errore del servizio.");
                    }
                });
                obj.isEdit = false;
                this.getView().getModel("Books").refresh();
            },

            onOpenFragmet: function(){
                let oView = this.getView();
                if(!this.byId('dialogID')){
                    Fragment.load({
                        name:"ui5.ui.view.sampleFragment",
                        controller: this,
                        id: oView.getId()
                    }).then(function(oDialog){
                        oDialog.open();
                    });
                }else{
                    this.byId('dialogID').open();
                }
            },
            onDialogueClose: function(){
                this.byId('dialogID').close();
                this.byId('dialogID').destroy(); // Cancella cache
            },


            onConfirmDialog: function(){
                var that = this;
                MessageBox.confirm("Si è sicuri di voler procedere ?",{
                    onClose: function(oAction){
                        if(oAction === 'OK'){
                            var title= that.getView().byId("titleID").getValue();
                            var genre= that.getView().byId("genreID").getSelectedKey();
                            var price= that.getView().byId("priceID").getValue();
                            var author= that.getView().byId("authorID").getValue();            
                            
                            var oModel= {
                                "title": title,
                                "genre": genre,
                                "price": price,
                                "author_ID": parseInt(author)
                            };
                            var aData = jQuery.ajax({
                                type:"POST",
                                contentType: "application/json",
                                url: "/ui5ui/Odata/odata/v2/AdminService/Books",
                                dataType: "json",
                                data: JSON.stringify(oModel),
                                async:false,
                                success: function(){
                                    that.getView().setBusy(false);
                                    MessageBox.success("Operazione eseguita!" ,{
                                        onClose: function(){
                                            that.onAjaxSearch();
                                            that.onCloseDialog();
                                            that.getOwnerComponent().getRouter().navTo("RouteMaster");
                                        }
                                    });
                                },
                                error: function(oError){
                                    MessageBox.error("Errore del servizio!");
                                    that.getView().setBusy(false);
                                }
            
                            })
                        }
                    }
                });
             },

            
            onAjaxSearch: function () {
                var bookName = this.getView().byId("bookName").getValue();
                let that= this;
                this.getView().setBusy(true);

                var aData = jQuery.ajax({
                    type: "GET",
                    contentType: "application/json",
                    url: "/ui5ui/Odata/odata/v4/CatalogService/Books?&filter=title eq '"+bookName+"'", //%20 è lo spazio  %27 sono gli apostrofi
                    dataType: "json",
                    async: false,
                    success: function(data, textStatus, jqXHR,oResults) {

                    this.getView().setModel(new JSONModel(data.value),"Books");
                    this.getView().setBusy(false);
                    }
                });
            }
            
            
        });
    });