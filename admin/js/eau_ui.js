requirejs(['js/calculateurDiagramme.js']);


var IndicateurSelect = React.createClass({
    updateIndicateur: function() {
        this.props.onIndicateurUpdated(this.refs.indicateur);
    },

    render: function() {
        return (
            <form role="form">
                <label htmlFor="indicateurSelect">Indicateur</label>
                <select className="form-control" id="indicateurSelector" ref="indicateur"
                        onChange={this.updateIndicateur}>
                    <option value="phosphore">Phospore total (μg/l)</option>
                    <option value="chlorophylle">Chlorophylle a (μg/l)</option>
                    <option value="carbone_organique_dissous">Carbone organique dissous (mg/l)</option>
                    <option value="transparence">Transparence de l'eau (m)</option>
                </select>
            </form>
        );
    }
});

var Diagramme = React.createClass({
    render: function() {
        var symbolSize = 10;
        var title = "Concentration moyenne en " + this.props.indicateur + " en " + this.props.annee;

        return (
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" height="220" width="600" fontFamily="sans">
                <defs>
                    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{stopColor: "#6985FB", stopOpacity: 1}}/>
                        <stop offset="100%" style={{stopColor: "#006500", stopOpacity: 1}}/>
                    </linearGradient>
                </defs>

                <g className="titre" transform="translate(50,0)">
                    <text x="250" y="20" textAnchor="middle" fontSize="16pt">{title}</text>
                </g>


                <g className="echelle" transform="translate(50,80)">
                    <rect width="500" height="100" fill="url(#grad2)"/>
                </g>

                <g className="legende" transform="translate(50,0)">

                    <text x="0" y="55" fill="black" textAnchor="middle">Ultra-
                        <tspan x="0" y="75" textAnchor="middle">oligotrophe</tspan>
                    </text>
                    <text x="83" y="65" fill="black" textAnchor="middle">Oligotrophe</text>
                    <path id="oligo-vs-meso" d="M 174 80 L 174 180 Z" stroke="black" strokeWidth="2" fill="none"/>
                    <text x="174" y="205"
                          textAnchor="middle">{CalculateurDiagramme.niveauTrophique[this.props.indicateur].oligotropheMax}</text>
                    <text x="250" y="65" fill="black" textAnchor="middle">Mésotrophe</text>
                    <path id="meso-vs-eu" d="M 346 80 L 346 180 Z" stroke="black" strokeWidth="2" fill="none"/>
                    <text x="346" y="205"
                          textAnchor="middle">{CalculateurDiagramme.niveauTrophique[this.props.indicateur].mesotropheMax}</text>
                    <text x="416" y="65" fill="black" textAnchor="middle">Eutrophe</text>
                    <text x="500" y="55" fill="black" textAnchor="middle">Hyper-
                        <tspan x="500" y="75" textAnchor="middle">eutrophe</tspan>
                    </text>
                </g>

                <g className="mesure" transform="translate(50,80)">
                    <rect x={CalculateurDiagramme.mesureVersPosition(this.props.indicateur, this.props.mesure) -
                    symbolSize / 2.0} y="50"
                          height={symbolSize} width={symbolSize} fill="rgb(255,255,0)"/>
                    <text x={CalculateurDiagramme.mesureVersPosition(this.props.indicateur, this.props.mesure) -
                    symbolSize / 2.0} y="80" fill="rgb(255,255,0)"
                          textAnchor="middle">{this.props.mesure.toFixed(1)}</text>

                </g>


            </svg>
        );
    }
});

var GenererDiagramme = React.createClass({
    handleSubmit: function(e) {
        e.preventDefault();
        var graphiquesRsvlZip = new JSZip();
        var graphiquesRsvlDir = graphiquesRsvlZip.folder("graphiques_rsvl");
        var graphiquesName = {"phosphore": [], "chlorophylle" : []};
        graphiquesRsvlDir.file("lisez-moi.txt", "Graphique du RSVL généré maintenant\n");
        rsvlDB.allDocs({include_docs: true, descending: true}).then(function(result) {
            var indicateurParAnnee = {phosphore: {}, chlorophylle: {}, transparence: {}, carbone_organique_dissous: {}};
            result.rows.forEach(function(row) {
                var dateMesure = new Date(row.doc.date);
                var annee = dateMesure.getFullYear();
                if (indicateurParAnnee[row.doc.indicateur][annee]) {
                    indicateurParAnnee[row.doc.indicateur][annee].push(row.doc.mesure);
                } else {
                    indicateurParAnnee[row.doc.indicateur][annee] = [row.doc.mesure];
                }

                console.log("Mesure de ", row.doc.indicateur, " du ", row.doc.date, " : ", row.doc.mesure);
            });
            console.log(indicateurParAnnee);

            var indicateursPourGraphique = ["phosphore", "chlorophylle"];

            indicateursPourGraphique.forEach(function(indicateur) {
                Object.keys(indicateurParAnnee[indicateur]).forEach(function(annee) {
                    var sum = indicateurParAnnee[indicateur][annee].reduce(function(prec, courant) {
                        return parseFloat(prec) + parseFloat(courant)
                    });
                    var moyenne = parseFloat(sum) / indicateurParAnnee[indicateur][annee].length;
                    console.log("La moyenne de " + indicateur + " pour l'année ", annee, " est ", moyenne);
                    var diagramme = ReactDOMServer.renderToStaticMarkup(<Diagramme indicateur={indicateur}
                                                                                   mesure={moyenne} annee={annee}/>);
                    var result = [diagramme,];
                    var blob = new Blob(result, {type: "image/svg+xml;charset=utf-8"});
                    var filename = indicateur + "_" + annee + ".svg";
                    graphiquesName[indicateur].push(filename);
                    graphiquesRsvlDir.file(filename, blob);

                });
            });

        }).then(
            function(res) {
                var listeJsContent = "";
                if (graphiquesName["phosphore"].length > 0 ) {
                    listeJsContent = listeJsContent + "\nvar graphiquePhosphore = [";
                    graphiquesName["phosphore"].forEach( function (filename) {
                        listeJsContent = listeJsContent + "\"graphiques_rsvl/" + filename + "\","
                    });
                    listeJsContent = listeJsContent + "];"
                }
                if (graphiquesName["chlorophylle"].length > 0 ) {
                    listeJsContent = listeJsContent + "\nvar graphiqueChlorophylle = [";
                    graphiquesName["chlorophylle"].forEach( function (filename) {
                        listeJsContent = listeJsContent + "\"graphiques_rsvl/" + filename + "\","
                    });
                    listeJsContent = listeJsContent + "];"
                }
                graphiquesRsvlDir.file("listes.js", listeJsContent);
                graphiquesRsvlZip.generateAsync({type: "blob"})
                    .then(function(blob) {
                        saveAs(blob, "graphiques_rsvl.zip");
                    });
            }
        );


    },

    render: function() {
        return (
            <div className="exporter">
                <form role="form" onSubmit={this.handleSubmit}>
                    <button type="submit" className="btn btn-default">Générer les diagrammes</button>
                </form>
            </div>
        );
    }
});

var QualiteEauWidget = React.createClass({
    getInitialState: function() {
        return {
            mesure: null,
            indicateur: "phosphore",
            date: null
        }
    },

    handleSubmit: function(e) {
        e.preventDefault();
        if (!this.state.mesure || !this.state.date) {
            alert("Veuillez complétez les champs obligatoires");
            return;
        }
        var mesure = {
            mesure: this.state.mesure,
            indicateur: this.state.indicateur,
            date: this.state.date
        };
        mesure._id = [mesure.indicateur, mesure.date].join("_");

        rsvlDB.get(mesure._id).then(function(doc) {
            mesure._rev = doc._rev;
            //TODO: put if doc exist
            return rsvlDB.put(mesure);
        }).then(function(response) {
            console.log("mesure updated!");
        }).catch(function(err) {
            console.log(err);
        });

        //TODO: put only if get doesn't work...
        rsvlDB.put(mesure, function callback(err, result) {
            if (!err) {
                console.log("Mesure ajoutée!");
            } else {
                console.error(err);
            }
        });
    },

    handleExport: function(e) {
        var rows = [];
        rows.push("date, indicateur, mesure");
        e.preventDefault();
        rsvlDB.allDocs({include_docs: true, descending: true}).then(function(resp) {
            var row;
            resp.rows.forEach(function(element) {
                row = [element.doc.date, element.doc.indicateur, element.doc.mesure].join(", ");
                rows.push(row)
            });
            console.log("Getting mesure from database... done!")
        }).then(
            function(res) {
                var csvContent, blob;
                csvContent = rows.join("\n");
                blob = new Blob([csvContent], {type: "text/csv;charset=utf-8"});
                console.log("Saving CSV...");
                saveAs(blob, "rsvl.csv");
            }
        ).catch(function(err) {
            console.error(err);
        });

    },

    handleImport: function(e) {
        e.preventDefault();
        PromiseFileReader.readAsText(this.refs.fichier.files[0]).then(function(importText) {
                var lines, entry, entries, values;
                entries = [];
                lines = [];

                lines = importText.split('\n');
                //Remove header
                lines.shift();
                lines.forEach(function(line) {
                    values = line.split(",");
                    values = values.map(function(val) {
                        return val.trim();
                    });
                    if (values.length === 3) {
                        entry = {date: values[0], indicateur: values[1], mesure: values[2]}
                        entries.push(entry);
                    }

                });

                return entries;
            }
        ).then(function(entries) {
                rsvlDB.bulkDocs(entries);
            }
        ).catch(
            function(err) {
                console.log(err)
            }
        );

    },

    handleDeleteAll: function(e) {
        e.preventDefault();
        rsvlDB.allDocs({include_docs: true, descending: true}).then(function(resp) {
            var row;
            resp.rows.forEach(function(element) {
                rsvlDB.remove(element.doc);
            });
            console.log("All measure are del from database... done!")
        })
    },

    updateIndicateur: function(indicateurRef) {
        var state = this.state;
        state.indicateur = indicateurRef.value;
        this.setState(state);
    },

    handleChange: function() {
        var state = this.state;
        state.mesure = this.refs.mesure.value;
        state.date = this.refs.date.value;
        this.setState(state);
    },

    render: function() {
        return (
            <div id="qualiteEauWidget">
                <IndicateurSelect onIndicateurUpdated={this.updateIndicateur}/>
                <label>Date de l'acquisition</label>
                <input type="date" className="form-control" placeholder="Date de l'acquisition" ref="date"
                       onChange={this.handleChange}/>
                <label>Mesure</label>
                <input type="text" className="form-control" placeholder="Mesure" ref="mesure"
                       onChange={this.handleChange}/>
                <button type="submit" className="btn btn-default" onClick={this.handleSubmit}>Soumettre</button>
                <div className="input-group">
                    <input type="file" className="form-control" ref="fichier" placeholder="Fichier de mesures"/>
                    <span className="input-group-btn">
                            <button type="submit" className="btn btn-default"
                                    onClick={this.handleImport}>Importer</button>
                        </span>

                </div>
                <button type="submit" className="btn btn-default" onClick={this.handleExport}>Exporter</button>
                <GenererDiagramme mesure={this.state.indicateur} valeur={this.state.mesure}/>
                <button type="submit" className="btn btn-danger" onClick={this.handleDeleteAll}>Supprimer toutes les
                    mesures
                </button>
            </div>
        );
    }
});

ReactDOM.render(
    <QualiteEauWidget/>,
    document.getElementById('eauContainer')
);
