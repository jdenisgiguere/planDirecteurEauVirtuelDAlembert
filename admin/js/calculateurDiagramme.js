/**
 * Created by jdgiguere on 16-09-03.
 */
var CalculateurDiagramme = (function() {

    var scaleLength = 500;

    var niveauTrophique = {
        phosphore: {
            ultraOligotrophe: 0,
            oligotropheMin: 4,
            oligoMesotropheMin: 7,
            oligotropheMax: 10,
            oligoMesotropheMax: 13,
            mesoEutropheMin: 20,
            mesotropheMax: 30,
            mesoEutropheMax: 35,
            eutropheMax: 100,
            hyperEutrophe: 300,
        },

        chlorophylle: {
            ultraOligotrophe:0,
            oligotropheMin: 1,
            oligoMesotropheMin: 2.5,
            oligotropheMax: 3,
            oligoMesotropheMax: 3.5,
            mesoEutropheMin: 6.5,
            mesotropheMax: 8,
            mesoEutropheMax: 10,
            eutropheMax: 25,
            hyperEutrophe: 100,

        },

        pixel: {
            ultraOligotrophe: 0,
            oligotropheMin: 19,
            oligoMesotropheMin: 122,
            oligotropheMax: 174,
            oligoMesotropheMax: 230,
            mesoEutropheMin: 288,
            mesotropheMax: 346,
            mesoEutropheMax: 407,
            eutropheMax: 483,
            hyperEutrophe: 500
        }
    };

    function interpollePixel(valeur, valeurMin, valeurMax, pixelMin, pixelMax) {
        var proportion;
        proportion = (valeur - valeurMin) / (valeurMax - valeurMin);
        return pixelMin + proportion * (pixelMax - pixelMin);
    }


    return {
        niveauTrophique: Object.freeze(niveauTrophique),

        mesureVersPosition: function(mesure, valeur) {
            var pixel, proportion;
            if (valeur < niveauTrophique[mesure].ultraOligotrophe) {
                throw {
                    name: "Erreur",
                    message: "Valeur plus petite que la plus petite valeur acceptée"
                };
            }
            else if (valeur >= niveauTrophique[mesure].ultraOligotrophe &&
                valeur < niveauTrophique[mesure].oligotropheMin) {
                pixel = interpollePixel(valeur,
                    niveauTrophique[mesure].ultraOligotrophe,
                    niveauTrophique[mesure].oligotropheMin,
                    niveauTrophique.pixel.ultraOligotrophe,
                    niveauTrophique.pixel.oligotropheMin);
            } else if (valeur >= niveauTrophique[mesure].oligotropheMin &&
                valeur < niveauTrophique[mesure].oligoMesotropheMin) {
                pixel = interpollePixel(valeur,
                    niveauTrophique[mesure].oligotropheMin,
                    niveauTrophique[mesure].oligoMesotropheMin,
                    niveauTrophique.pixel.oligotropheMin,
                    niveauTrophique.pixel.oligoMesotropheMin);
            } else if (valeur >= niveauTrophique[mesure].oligoMesotropheMin &&
                valeur < niveauTrophique[mesure].oligotropheMax) {
                pixel = interpollePixel(valeur,
                    niveauTrophique[mesure].oligoMesotropheMin,
                    niveauTrophique[mesure].oligotropheMax,
                    niveauTrophique.pixel.oligoMesotropheMin,
                    niveauTrophique.pixel.oligotropheMax);
            } else if (valeur >= niveauTrophique[mesure].oligotropheMax &&
                valeur < niveauTrophique[mesure].oligoMesotropheMax) {
                pixel = interpollePixel(valeur,
                    niveauTrophique[mesure].oligotropheMax,
                    niveauTrophique[mesure].oligoMesotropheMax,
                    niveauTrophique.pixel.oligotropheMax,
                    niveauTrophique.pixel.oligoMesotropheMax);

            } else if (valeur >= niveauTrophique[mesure].oligoMesotropheMax &&
                valeur < niveauTrophique[mesure].mesoEutropheMin) {
                pixel = interpollePixel(valeur,
                    niveauTrophique[mesure].oligoMesotropheMax,
                    niveauTrophique[mesure].mesoEutropheMin,
                    niveauTrophique.pixel.oligoMesotropheMax,
                    niveauTrophique.pixel.mesoEutropheMin
                );
            } else if (valeur >= niveauTrophique[mesure].mesoEutropheMin &&
                valeur < niveauTrophique[mesure].mesotropheMax) {
                pixel = interpollePixel(valeur,
                    niveauTrophique[mesure].mesoEutropheMin,
                    niveauTrophique[mesure].mesotropheMax,
                    niveauTrophique.pixel.mesoEutropheMin,
                    niveauTrophique.pixel.mesotropheMax
                );

            } else if (valeur >= niveauTrophique[mesure].mesotropheMax &&
                valeur < niveauTrophique[mesure].mesoEutropheMax) {
                pixel = interpollePixel(valeur,
                    niveauTrophique[mesure].mesotropheMax,
                    niveauTrophique[mesure].mesoEutropheMax,
                    niveauTrophique.pixel.mesotropheMax,
                    niveauTrophique.pixel.mesoEutropheMax
                );

            } else if (valeur >= niveauTrophique[mesure].mesoEutropheMax &&
                valeur < niveauTrophique[mesure].eutropheMax) {
                pixel = interpollePixel(valeur,
                    niveauTrophique[mesure].mesoEutropheMax,
                    niveauTrophique[mesure].eutropheMax,
                    niveauTrophique.pixel.mesoEutropheMax,
                    niveauTrophique.pixel.eutropheMax
                );

            } else if (valeur >= niveauTrophique[mesure].eutropheMax &&
                valeur <= niveauTrophique[mesure].hyperEutrophe) {
                pixel = interpollePixel(valeur,
                    niveauTrophique[mesure].eutropheMax,
                    niveauTrophique[mesure].hyperEutrophe,
                    niveauTrophique.pixel.eutropheMax,
                    niveauTrophique.pixel.hyperEutrophe
                );

            } else if (valeur > niveauTrophique[mesure].hyperEutrophe ) {
                alert(mesure, " est plus grand que ", niveauTrophique[mesure].hyperEutrophe);
                pixel = niveauTrophique.pixel.hyperEutrophe
            }
            return pixel;
        }
    }

})();

try {
    module.exports = CalculateurDiagramme;
} catch (err) {
    console.log(err.message);
}
