/**
 * 
 * A partir d'un mot donné, cherche des paramètres menant à la génération de ce mot
 * 
 */

// Mots
var DIRECTIONS_OPPOSEES = {
    'H' : 'B',
    'B' : 'H',
    'G' : 'D',
    'D' : 'G'
};

var LETTRE_SUIVANTE = { // Lettre suivante lors d'une rotation du plateau de 90° dans le sens trigonomètrique
    'H': 'G',
    'B': 'D',
    'G': 'B',
    'D': 'H'
};

// Résultat
var COTE_PLATEAU = 420;
var COEFFICIENT_MULTIPLICATEUR_VITESSE = 20;


function getMemeOrientation (a, b) // Vérifie que deux directions sont dans la même orientation (verticale ou horizontale)
{
    if (a == b || a == DIRECTIONS_OPPOSEES[b]) {
        return true;
    }
    return false;
}


/*
 * Intervalles
 */

function getIntervalles (mot)
{
    var orientationDepart = mot[0];

    var intervalles = [];
    var nbIntervallesEnCours = 0;
    var nbFrontieres = 0;

    for (var iCaractere=0; iCaractere<=mot.length; iCaractere++) {
        if (iCaractere == mot.length || getMemeOrientation(mot[iCaractere], orientationDepart)) {
            var tailleIntervalle = 1 / nbIntervallesEnCours;

            for (var iIntervalleAjoute=0; iIntervalleAjoute<nbIntervallesEnCours; iIntervalleAjoute++) {
                intervalles.push([
                    nbFrontieres-1 + iIntervalleAjoute * tailleIntervalle,
                    nbFrontieres-1 + (iIntervalleAjoute+1) * tailleIntervalle
                ]);
            }
            
            nbIntervallesEnCours = 0;
            nbFrontieres++;
        }
        else {
            nbIntervallesEnCours++;
        }

    }
    
    return intervalles;
}


/*
 * Système d'inéquations
 */

// ax + y COMP b
var Inequation = function (a=0, b=0, comp='<')
{
    this.a = a;
    this.b = b;
    this.comp = comp; // < OU >
};

var Point = function (x=0, y=0)
{
    this.x = x;
    this.y = y;
};

function getEquation (point1, point2)
{
    var x1 = point1.x;
    var y1 = point1.y;
    var x2 = point2.x;
    var y2 = point2.y;

    var a = (y1 - y2) / (x1 - x2);
    var b = y1 - (x1 * a);

    return [a, b];
}

function getPointIntersection (point1, point2, a, b) // a et b représentent l'équation de la droite: ax + y = b
{
    b = -b;

    if (point1.x == point2.x) {
        var y = a * point1.x + b;
        return new Point(point1.x, y);
    }

    if (point1.y == point2.y) {
        var x = (point1.y - b) / a;
        return new Point(x, point1.y);
    }

    var equation = getEquation(point1, point2);

    var c = equation[0];
    var d = equation[1];

    var y = (b - d * (a / c)) / (1 - a / c);
    var x = (y - b) / a;

    return new Point(x, -y);
}

function getEstSolution (inequation, point)
{
    var membreGauche = inequation.a * point.x + inequation.b;
    var membreDroite = point.y;

    if (inequation.comp == '<') {
        return membreGauche < membreDroite;
    }
    else {
        return membreGauche > membreDroite;
    }
}


function getBarycentre (points)
{
    var sommeX = 0;
    var sommeY = 0;

    points.forEach(function(point) {
        sommeX += point.x;
        sommeY += point.y;
    }, this);

    return new Point(sommeX/points.length, sommeY/points.length);
}

function getISuivant (i, total)
{
    if (i == total-1) {
        return 0;
    }
    return i + 1;
}

function getIPrecedant (i, total)
{
    if (i == 0) {
        return total - 1;
    }
    return i - 1;
}

function resoudreSysteme (inequations)
{
    // Sommets du polygone des contraintes, par ordre trigonométrique
    // Contraintes de départ : x>0 ; x<1000 ; y > 0 ; y < 1000
    var valeurMax = 1000;

    var points = [
        new Point(0, 0),
        new Point(valeurMax, 0),
        new Point(valeurMax, valeurMax),
        new Point(0, valeurMax)
    ];


    inequations.forEach(function(inequation) {

        // Début inclus, fin excluse
        var iDebut = -1;
        var iFin = -1;

        var nbPoints = points.length;

        points.forEach(function(point, iPoint) {

            var iPrecedant = getIPrecedant(iPoint, nbPoints);
            var iSuivant = getISuivant(iPoint, nbPoints);

            if (!getEstSolution(inequation, point)) {

                if (getEstSolution(inequation, points[iPrecedant])) {
                    iDebut = iPoint;
                }
                if (getEstSolution(inequation, points[iSuivant])) {
                    iFin = iSuivant;
                }

            }

        }, this);

        if (iDebut == -1 && iFin == -1) {

            if (!getEstSolution(inequation, points[0])) { // Le système n'admet pas de solution
                return -1;
            } // Sinon: l'inéquation n'ajoute aucune contrainte

        }
        else { // L'inéquation ajoute une contrainte

            console.log('Ajout d\'une contrainte');

            console.log('Contrainte: ' + inequation.a + ' ' + inequation.b + ' ' + inequation.comp);

            points.forEach(function(point) {
                console.log(point.x + ' ' + point.y);
            }, this);

            while (iFin != 0) { // Décale les points du polygone des contraintes jusqu'à ce que tous les points à supprimer se trouvent à la fin
                iFin = getIPrecedant(iFin, nbPoints);
                iDebut = getIPrecedant(iDebut, nbPoints);
                points.push( points.shift() )
            }

            ajout1 = getPointIntersection(points[iDebut], points[iDebut-1], inequation.a, inequation.b);
            ajout2 = getPointIntersection(points[nbPoints-1], points[0], inequation.a, inequation.b);

            while (points.length != iDebut) {
                points.pop();
            }

            points.push(ajout1);
            points.push(ajout2);

            console.log('Après:');

            console.log('Taille: ' + points.length);
            points.forEach(function(point) {
                console.log(point.x + ' ' + point.y);
            }, this);

            console.log('FIN\n');

        }

    }, this);


    //return new Point(1.725, 0.5);

    resultat = getBarycentre(points);

    alert(resultat.x + " " + resultat.y);

    return resultat;
}


/*
 * Vérification
 */

function estValide (positionsChoisies, intervalles)
{
    for (var iPosition=0; iPosition<positionsChoisies.length; iPosition++) {
        var position = positionsChoisies[iPosition];
        var intervalle = intervalles[iPosition];

        if (position < intervalle[0] || position > intervalle[1]) {
            return false;
        }
    }

    return true;
}


/*
 * Recherche
 */

function rechercherMot ()
{
    var mot = document.forms['formulaire-mot'].elements['mot'].value;

    // Vérification de la validité du mot
    if (! /^[HBGD]+$/.test(mot)) { // Le mot donné est invalide
        Materialize.toast('Mot invalide', 3000);
        return;
    }

    // Rotation du mot pour qu'il commence par un G
    var nbRotations = 0;

    while (mot[0] != 'G') {
        var nouveauMot = "";
        for (var iLettre=0; iLettre<mot.length; iLettre++) {
            nouveauMot += LETTRE_SUIVANTE[mot[iLettre]];
        }
        mot = nouveauMot;
        nbRotations++;
    }


    // Génération des intervalles
    var intervalles = getIntervalles(mot);

    inequations = [
        new Inequation(-1, 0, '<') // y < x
    ]; // x>0 et y>0 sont ajoutés lors de la résolution du système

    intervalles.forEach(function(intervalle, iIntervalle) {

        // Début
        var inequationDebut = new Inequation(iIntervalle, intervalle[0], '>'); // ax + y COMP b
        inequations.push(inequationDebut);

        // Fin
        var inequationFin = new Inequation(iIntervalle, intervalle[1], '<');
        inequations.push(inequationFin);

    }, this);

    var solutionSysteme = resoudreSysteme(inequations);

    if (solutionSysteme == -1) {
        Materialize.toast('Aucune solution', 3000);
        return;
    }


    // Calcul des résultats
    var vxDepart = -1 * COEFFICIENT_MULTIPLICATEUR_VITESSE;
    var vyDepart = (1 / solutionSysteme.x) * COEFFICIENT_MULTIPLICATEUR_VITESSE;
    var xDepart = 0;
    var yDepart = Math.abs((COTE_PLATEAU * solutionSysteme.y) * vyDepart / vxDepart);

    if (mot[1] == 'H') {
        yDepart = COTE_PLATEAU - yDepart;
    }


    // Rotation
    for (var iRotation=0; iRotation<4-nbRotations; iRotation++) { // Rotation de la solution dans le sens trigonométrique
        var ancienVX = vxDepart;
        vxDepart = -vyDepart;
        vyDepart = ancienVX;

        var ancienXDepart = xDepart;
        xDepart = COTE_PLATEAU - yDepart;
        yDepart = ancienXDepart;
    }


    // Affichage des résultats
    var elementsFormulaire = document.forms['parametres'].elements;
    elementsFormulaire['largeur-plateau'].value = COTE_PLATEAU;
    elementsFormulaire['hauteur-plateau'].value = COTE_PLATEAU;
    elementsFormulaire['balle-x'].value = xDepart;
    elementsFormulaire['balle-y'].value = yDepart;
    elementsFormulaire['vitesse-x'].value = vxDepart;
    elementsFormulaire['vitesse-y'].value = vyDepart;

    Materialize.toast('Solution trouvée !', 3000);
    $('#fenetre-calcul').modal('close');
    demarrer();
}
