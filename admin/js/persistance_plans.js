actionDB = new PouchDB('actions');

function putAction(action) {
    action.critere = 'Bandes riveraines';

    //Update case
    actionDB.get(action._id).then(function(doc) {
        action._rev = doc._rev;
        return actionDB.put(action);
    }).then(function(response) {
        console.log("action updated!");
    }).catch(function(err) {
        console.log(err);
    });

    //Create case
    actionDB.put(action, function callback(err, result) {
        if (!err) {
            console.log('Comment successfully added');
        }
    });
}

function loadAllActions(actionBox) {
    actionDB.allDocs({include_docs: true, descending: true}, function(err, doc) {
        var data = [];
        doc.rows.forEach(function(element) {
            data.push({
                description: element.doc.description,
                responsable: element.doc.responsable,
                partenaire: element.doc.partenaire,
                frequence: element.doc.frequence,
                echeance: element.doc.echeance,
                etat: element.doc.etat,
                order: element.doc.order,
                _id: element.doc._id
            });
        })
        actionBox.setState({data: data});
    });
}

function loadAction(_id) {
    var action;
    action = actionDB.get(_id, function(err, doc) {
        if (err) {
            return console.log(err);
        }
        return doc;
    });

    return action;
}

function deleteAction(_id) {
    actionDB.get(_id, function(err, doc) {
        if (err) {
            return console.log(err);
        }
        actionDB.remove(doc, function(err, resp) {
            if (err) {
                return console.log(err);
            }
        });
    });
}