var ActionLine = React.createClass({
    handleRemove: function() {
        this.props.onLineRemoval(this.props._id);
    },
    handleEdit: function() {
        this.props.onLineEdit(this.props._id);
    },

    handleArrowUp: function() {
        this.props.onArrowUp(this.props._id);
    },

    handleArrowDown: function() {
        this.props.onArrowDown(this.props._id);
    },

    render: function() {
        return (
            <tr>
                <td>{this.props.description}</td>
                <td><a href="#" onClick={this.handleEdit}><span className="glyphicon glyphicon-pencil"
                                                                aria-hidden="true" style={{color: "black"}}/></a></td>
                <td><a href="#" onClick={this.handleRemove}><span className="glyphicon glyphicon-remove"
                                                                  aria-hidden="true" style={{color: "red"}}/></a></td>
                <td><a href="#" onClick={this.handleArrowUp}><span className="glyphicon glyphicon-arrow-up"
                                                                   aria-hidden="true" style={{color: "black"}}/></a>
                </td>
                <td><a href="#" onClick={this.handleArrowDown}><span className="glyphicon glyphicon-arrow-down"
                                                                     aria-hidden="true" style={{color: "black"}}/></a>
                </td>

            </tr>
        );
    }
});

var ActionList = React.createClass({

    handleActionRemoval: function(action_id) {
        this.props.onActionRemoval(action_id);
    },

    handleActionEdit: function(action_id) {
        this.props.onActionEdit(action_id);
    },

    handleActionOrderUp: function(action_id) {
        this.props.onActionOrderUp(action_id);
    },

    handleActionOrderDown: function(action_id) {
        this.props.onActionOrderDown(action_id);
    },

    render: function() {
        var me = this;
        var actionsLines = this.props.data.sort(function(a, b) {
            return a.order - b.order
        }).map(function(action) {
            return (
                <ActionLine onLineRemoval={me.handleActionRemoval} onLineEdit={me.handleActionEdit}
                            onArrowUp={me.handleActionOrderUp} onArrowDown={me.handleActionOrderDown}
                            description={action.description} key={action._id}
                            _id={action._id}/>
            );
        });

        return (
            <div className="actionList">
                <table className="table table-hover">
                    <thead>
                    <tr>
                        <th>Description</th>
                        <th>Modifier</th>
                        <th>Supprimer</th>
                    </tr>
                    </thead>
                    <tbody>
                    {actionsLines}
                    </tbody>
                </table>
            </div>
        );
    }
});

var ActionBox = React.createClass({
    getInitialState: function() {
        return {
            data: [],
            edit: {
                description: '',
                responsable: '',
                partenaire: '',
                frequence: '',
                echeance: '',
                etat: ''
            }
        };
    },

    loadActionsFromDatabase: function() {
        loadAllActions(this);
    },

    handleActionSubmit: function() {
        var description = this.state.edit.description.trim();
        var responsable = this.state.edit.responsable.trim();
        var partenaire = this.state.edit.partenaire.trim();
        var frequence = this.state.edit.frequence.trim();
        var echeance = this.state.edit.echeance.trim();
        var etat = this.state.edit.etat;
        //TODO do not encode criteria name
        var _id = ['bandes_riveraines', description].join(" ");

        var order = this.state.data.length + 1;

        var action = {
            _id: _id,
            order: order,
            description: description,
            responsable: responsable,
            partenaire: partenaire,
            frequence: frequence,
            echeance: echeance,
            etat: etat
        };

        var state = this.state;
        state.edit.description = '';
        state.edit.responsable = '';
        state.edit.partenaire = '';
        state.edit.frequence = '';
        state.edit.echeance = '';
        state.edit.etat = 'planifie';
        this.setState(state);

        var actions = this.state.data;
        var newAction = actions.reduce(function(dontExist, current) {
            if (dontExist) {
                return !(current._id == _id);
            }
        }, true);

        if (newAction) {
            var newActions = actions.concat([action]);
            this.setState({data: newActions});
        }

        putAction(action);

    },

    handleActionRemoval: function(action_id) {
        var actions = this.state.data;
        var newActions = actions.filter(function(elem) {
            return elem._id !== action_id;
        });

        var orderUpdated;
        var me = this;
        actionDB.get(action_id).then(function(doc) {
            orderUpdated = doc.order;

            console.info("Getting order updated is ", orderUpdated);

            return orderUpdated;
        }).then(
            function(resp) {
                actionDB.allDocs({include_docs: true, descending: true}, function(err, doc) {
                    doc.rows.forEach(function(element) {
                        if (element.doc.order > orderUpdated) {
                            console.log("Decrease order index of 1 for action ", element.doc.action);
                            element.doc.order = element.doc.order - 1;
                            actionDB.put(element.doc, function callback(err, result) {
                                if (err) {
                                    console.error(err)
                                }
                            });
                        } else {
                            //We don't change order index on removal when index is lower than removed index
                        }
                    });
                });
                console.info("PouchDB order index updated after removal");

                return true;
            }
        ).then(
            function(resp) {
                newActions = newActions.map(function(elem) {
                    console.log("Updating order in state base on orderUpdate = ", orderUpdated);
                    console.log(elem);
                    if (elem.order > orderUpdated) {
                        elem.order = elem.order - 1;
                        console.log("Descrease state order of action ", elem.description)
                    } else {
                        console.log("Keep state order of action ", elem.description)
                    }
                    return elem;
                });
                console.info("new actions order index are updated");
            }
        ).then(
            function(resp) {
                me.setState({data: newActions});
                console.info("new actions order index are update in state!");
            }(this)
        ).catch(function(err) {
            console.log(err);
        });

        deleteAction(action_id);
    },

    handleActionEdit: function(action_id) {
        var me = this;
        actionDB.get(action_id).then(function(doc) {
            var state = me.state;
            state.edit = doc;
            me.setState(state);
        }).catch(function(err) {
            console.log(err);
        });
        console.log('edit!');
    },

    handleFormUpdate: function(refs) {
        var state = this.state;
        state.edit.description = refs.description.value;
        state.edit.responsable = refs.responsable.value;
        state.edit.partenaire = refs.partenaire.value;
        state.edit.frequence = refs.frequence.value;
        state.edit.echeance = refs.echeance.value;
        state.edit.etat = refs.etat.value;
        this.setState(state);
    },

    handleActionOrderUp: function(action_id) {
        var orderUpdated, orderUpdatedUi;

        //Update database
        actionDB.get(action_id).then(function(doc) {
            orderUpdated = doc.order;
        }).then(
            actionDB.allDocs({include_docs: true, descending: true}, function(err, doc) {
                doc.rows.forEach(function(element) {
                    if (orderUpdated === 1) {
                        console.log("We cannot decrease order index of the first item");
                    } else if (element.doc.order === (orderUpdated - 1)) {
                        // We increase order index of
                        console.log("We increase order index of ", element.doc.description);
                        element.doc.order = element.doc.order + 1;
                        actionDB.put(element.doc, function callback(err, result) {
                            if (err) {
                                console.error(err)
                            }
                        });

                    } else if (element.doc.order === orderUpdated) {
                        //We decrease order index of
                        console.log("We decrease order index of ", element.doc.description);
                        element.doc.order = element.doc.order - 1;
                        actionDB.put(element.doc, function callback(err, result) {
                            if (err) {
                                console.error(err)
                            }
                        });
                    } else {
                        //We don't change order index of
                    }
                })
            })
        ).catch(function(err) {
            console.log(err);
        });

        //Update UI
        var state, data, me;
        me = this;
        state = this.state;
        console.log(state);
        actionDB.get(action_id).then(function(doc) {
            orderUpdatedUi = doc.order;
            console.log("doc ", doc);
            console.log("orderUpdatedUi", orderUpdatedUi);
        }).then(function() {
                data = me.state.data.map(function(element) {
                    var e = element;
                    console.log("orderUpdatedUi", orderUpdatedUi);
                    if (orderUpdatedUi === 1) {
                        console.log("We cannot decrease order index of first item");
                    } else if (element.order === (orderUpdatedUi - 1)) {
                        console.log("Increasing index of", e.description);
                        e.order = element.order + 1;

                    } else if (element.order === orderUpdatedUi) {
                        console.log("Decreasing index of ", e.description);
                        e.order = element.order - 1;
                    } else {
                        console.log("Index of ", e.description, " does not change");
                    }
                    console.log(e);
                    return e;
                })
            }
        ).then(
            function() {
                state.data = data;
                console.log(state);
                me.setState(state)
            }
        ).catch(
            function(err) {
                console.log(err);
            }
        );

    },

    handleActionOrderDown(action_id) {
        var orderUpdated, orderUpdatedUi, nbActions;

        nbActions = this.state.data.length;

        //Update database
        actionDB.get(action_id).then(function(doc) {
            orderUpdated = doc.order;
            console.log("We are going to put action order ", orderUpdated, " down");
        }).then(
            actionDB.allDocs({include_docs: true, descending: true}, function(err, doc) {
                doc.rows.forEach(function(element) {
                    if (orderUpdated === nbActions) {
                        console.log("We cannot decrease order index of the last item");
                    } else if (element.doc.order === orderUpdated) {
                        //We increase order index of
                        element.doc.order = element.doc.order + 1;
                        actionDB.put(element.doc, function callback(err, result) {
                            if (err) {
                                console.error(err)
                            }
                        });
                    } else if (element.doc.order === (orderUpdated + 1)) {
                        //We increase order index of
                        element.doc.order = element.doc.order - 1;
                        actionDB.put(element.doc, function callback(err, result) {
                            if (err) {
                                console.error(err)
                            }
                        });
                    } else {
                        //We don't change order index of
                    }
                })
            })
        ).catch(function(err) {
            console.log(err);
        });

        //Update UI
        var state, data, me;
        me = this;
        state = this.state;
        console.log(state);
        actionDB.get(action_id).then(function(doc) {
            orderUpdatedUi = doc.order;
            console.log("doc ", doc);
            console.log("orderUpdatedUi", orderUpdatedUi);
        }).then(function() {
                data = me.state.data.map(function(element) {
                    var e = element;
                    console.log("orderUpdatedUi", orderUpdatedUi);
                    if (orderUpdatedUi === nbActions) {
                        //We cannot decrease order of last item
                    } else if (element.order === orderUpdatedUi) {
                        e.order = element.order + 1;

                    } else if (element.order === (orderUpdatedUi + 1)) {
                        e.order = element.order - 1;
                    } else {
                        console.log("Index of ", e.description, " does not change");
                    }
                    console.log(e);
                    return e;
                })
            }
        ).then(
            function() {
                state.data = data;
                console.log(state);
                me.setState(state)
            }
        ).catch(
            function(err) {
                console.log(err);
            }
        );
    },

    removeAllActions: function() {
        //Database
        actionDB.allDocs({
            include_docs: true,
            attachments: true
        }).then(function(result) {
            result.rows.forEach(function(row) {
                actionDB.remove(row.doc);
            })
        }).catch(function(err) {
            console.log(err);
        });

        //UI
        var state = this.state;
        state.data = [];
        this.setState(state);


    },

    componentDidMount: function() {
        this.loadActionsFromDatabase()
    },


    render: function() {
        return (
            <div id="actionBox">
                <h2>Actions</h2>
                <ActionList data={this.state.data} onActionRemoval={this.handleActionRemoval}
                            onActionEdit={this.handleActionEdit}
                            onActionOrderUp={this.handleActionOrderUp}
                            onActionOrderDown={this.handleActionOrderDown}/>
                <ActionDetail edit={this.state.edit} onActionSubmit={this.handleActionSubmit}
                              onUserInput={this.handleFormUpdate}/>
                <GenererHtml data={this.state.data}/>
                <Importer onDataImported={this.loadActionsFromDatabase}/>
                <Exporter/>
                <SupprimerToutesLesActions onRemoveAllSubmit={this.removeAllActions}/>

            </div>
        );
    }
});

var ActionDetail = React.createClass({

    handleChange: function() {
        this.props.onUserInput(this.refs);
    },


    handleSubmit: function(e) {
        e.preventDefault();
        this.props.onActionSubmit();
    },

    render: function() {
        return (
            <div className="actionDetail">
                <h3>Édition d'une action</h3>
                <form role="form" onSubmit={this.handleSubmit}>

                    <div className="form-group">
                        <label htmlFor="actionDescription">Description de l'action</label>
                        <input type="text" className="form-control" placeholder="Description de l'action"
                               value={this.props.edit.description} ref="description" onChange={this.handleChange}
                               id="actionDescription"/>
                        <label htmlFor="actionResponsable">Responsable de l'action</label>
                        <input type="text" className="form-control" placeholder="Responsable de l'action"
                               value={this.props.edit.responsable} ref="responsable" onChange={this.handleChange}
                               id="actionResponsable"/>
                        <label htmlFor="actionPartenaire">Partenaire</label>
                        <input type="text" className="form-control" placeholder="Partenaire"
                               value={this.props.edit.partenaire} ref="partenaire" onChange={this.handleChange}
                               id="actionPartenaire"/>
                        <label htmlFor="actionFrequence">Fréquence</label>
                        <input type="text" className="form-control" placeholder="Fréquence"
                               value={this.props.edit.frequence} ref="frequence" onChange={this.handleChange}
                               id="actionFrequence"/>
                        <label htmlFor="actionEcheance">Échéancier</label>
                        <input type="text" className="form-control" placeholder="Échéancier"
                               value={this.props.edit.echeance} ref="echeance" onChange={this.handleChange}
                               id="actionEcheance"/>
                        <label htmlFor="actionEtat">État</label>
                        <select value={this.props.edit.etat} ref="etat" className="form-control"
                                onChange={this.handleChange}
                                id="actionEtat">
                            <option value="continue">En continu</option>
                            <option value="planifie">Planifié</option>
                            <option value="cours">En cours</option>
                            <option value="realise">Réalisé</option>
                            <option value="annule">Annulé</option>
                            <option value="retard">En retard</option>
                        </select>


                    </div>
                    <button type="submit" className="btn btn-default" style={{marginBottom: "48px"}}>Soumettre</button>
                </form>


            </div>
        );
    }

});


var ActionPlanLine = React.createClass({
    render: function() {
        return (
            <tr>
                <td>{this.props.description}</td>
                <td>{this.props.responsable}</td>
                <td>{this.props.partenaire}</td>
                <td>{this.props.frequence}</td>
                <td>{this.props.echeance}</td>
                <td><ActionPlanEtat etat={this.props.etat}/></td>
            </tr>
        );
    }
});


var ActionPlanEtat = React.createClass({
    render: function() {
        var text, icon, color;
        switch (this.props.etat) {
            case 'planifie':
                text = 'Planifié';
                icon = 'glyphicon glyphicon-calendar';
                color = 'green';
                break;
            case 'continue':
                text = 'En continu';
                icon = 'glyphicon glyphicon-refresh';
                color = 'green';
                break;
            case 'cours':
                text = 'En cours';
                icon = 'glyphicon glyphicon-signal';
                color = 'green';
                break;
            case 'realise':
                text = 'Réalisé';
                icon = 'glyphicon glyphicon-check';
                color = 'green';
                break;
            case 'annule':
                text = 'Annulé';
                icon = 'glyphicon glyphicon-remove';
                color = 'red';
                break;
            case 'retard':
                text = 'En retard';
                icon = 'glyphicon glyphicon-road';
                color = 'orange';


        }
        return (
            <span><span className={icon} aria-hidden="true" style={{color: color}}></span>{text}</span>
        )
    }
});


var ActionPlan = React.createClass({

    render: function() {
        var me = this;
        var actionsLines = this.props.data.map(function(action) {
            return (
                <ActionPlanLine key={action._id} description={action.description} responsable={action.responsable}
                                partenaire={action.partenaire} frequence={action.frequence} echeance={action.echeance}
                                etat={action.etat} _id={action._id}/>
            );
        });

        return (
            <div className="actionPlan">
                <table className="table table-hover">
                    <thead>
                    <tr>
                        <th>Action</th>
                        <th>Responsable</th>
                        <th>Partenaires</th>
                        <th>Fréquence</th>
                        <th>Échéancier</th>
                        <th>État</th>
                    </tr>
                    </thead>
                    <tbody>
                    {actionsLines}
                    </tbody>
                </table>
            </div>
        );
    }
});


var GenererHtml = React.createClass({
    handleSubmit: function(e) {
        e.preventDefault();
        var a = 0;
        var htmlParts = [
            '<!DOCTYPE html>',
            '<html lang="fr" xmlns="http://www.w3.org/1999/html">',
            '<head>',
            '<meta charset="UTF-8">',
            '<meta name="viewport" content="width=device-width, initial-scale=1">',
            '<title>Plan d\'action pour les bandes riveraines</title>',
            '<!-- Latest compiled and minified CSS -->',
            '<link rel="stylesheet" href="http://netdna.bootstrapcdn.com/bootstrap/3.0.3/css/bootstrap.min.css">',
            '<!-- Optional theme -->',
            '<link rel="stylesheet" href="http://netdna.bootstrapcdn.com/bootstrap/3.0.3/css/bootstrap-theme.min.css">',
            '</head>',
            '<body>',
            '<div class="container">',
            '<!-- Début de la table du plan d\'action. Copier à partir d\'ici -->',
        ];
        htmlParts.push(ReactDOMServer.renderToStaticMarkup(<ActionPlan data={this.props.data}/>));
        var moreHtml = ['<!-- Fin de la table du plan d\'action. Arrêter de copier ici. -->',
            '</div>',
            '<!-- Latest compiled and minified JavaScript -->',
            '<script src="http://netdna.bootstrapcdn.com/bootstrap/3.0.3/js/bootstrap.min.js"></script>',
            '</body>',
            '</html>'];
        htmlParts = htmlParts.concat(moreHtml);
        var blob = new Blob(htmlParts, {type: "text/html;charset=utf-8"});
        saveAs(blob, "pdaction.html");
    },

    render: function() {
        return (
            <div className="generationHtml">
                <form role="form" onSubmit={this.handleSubmit}>
                    <button type="submit" className="btn btn-default">Générer HTML</button>
                </form>
            </div>
        );
    }
});


var Importer = React.createClass({
    handleSubmit: function(e) {
        var me = this;
        e.preventDefault();

        PromiseFileReader.readAsText(this.refs.fichier.files[0]).then(function(importText) {
            var importJson, doc, docs;
            console.log(importText);
            importJson = JSON.parse(importText);
            docs = importJson.rows.map(function(row) {
                doc = row.doc;
                delete doc._rev;
                return doc;
            });
            console.log('docs:');
            console.log(docs);
            actionDB.bulkDocs(docs).then(function(result) {
                console.log("Importation réussie");
                console.log(result);
                me.props.onDataImported();
            }).catch(function(err) {
                console.log(err);
            });
        }).catch(function(err) {
            console.log(err)
        });

    },

    render: function() {
        return (
            <div className="importer">
                <form role="form" onSubmit={this.handleSubmit}>
                    <div className="input-group">
                        <input type="file" className="form-control" ref="fichier" placeholder="Fichier d'actions"/>
                        <span className="input-group-btn">
                            <button type="submit" className="btn btn-default">Importer un plan d'action</button>
                        </span>

                    </div>

                </form>
            </div>
        );
    }
});

var Exporter = React.createClass({
    handleSubmit: function(e) {
        e.preventDefault();
        actionDB.allDocs({
            include_docs: true,
            attachments: true
        }).then(function(result) {
            var blob = new Blob([JSON.stringify(result)], {type: "application/json;charset=utf-8"});
            saveAs(blob, "actions.json");
        }).catch(function(err) {
            console.log(err);
        });

    },

    render: function() {
        return (
            <div className="exporter">
                <form role="form" onSubmit={this.handleSubmit}>
                    <button type="submit" className="btn btn-default">Exporter un plan d'action</button>
                </form>
            </div>
        );
    }
});

var SupprimerToutesLesActions = React.createClass({
    handleSubmit: function(e) {
        e.preventDefault();
        this.props.onRemoveAllSubmit();
    },

    render: function() {
        return (
            <div className="exporter">
                <form role="form" onSubmit={this.handleSubmit}>
                    <button type="submit" className="btn btn-danger">Supprimer toutes les actions</button>
                </form>
            </div>
        );
    }
});


ReactDOM.render(
    <ActionBox />,
    document.getElementById('actionContainer')
);