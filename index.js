const canvasJeu = document.getElementById('gameCanvas');
const contexte = canvasJeu.getContext('2d');

// Éléments audio
const sonMoteur = document.getElementById('sonMoteur');
const sonExplosion = document.getElementById('sonExplosion');
const sonVictoire = document.getElementById('sonVictoire');

// Système Audio
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// État audio
let audioEtat = {
    moteurActif: false,
    alerteActif: false,
    alerteOscillateur: null,
    alerteGain: null
};

// Démarrer le son du moteur
function demarrerSonMoteur() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    sonMoteur.play().catch(() => {});
    audioEtat.moteurActif = true;
}

// Mettre à jour le son du moteur (intensité basée sur l'accélération)
function mettreAJourSonMoteur(intensite) {
    if (!sonMoteur) return;

    if (intensite > 0.01) {
        sonMoteur.volume = intensite * 0.25; // Ajuster le volume en fonction de l'intensité
        if (sonMoteur.paused) {
            sonMoteur.play().catch(() => {});
        }
    } else {
        sonMoteur.pause();
    }
}

// Jouer le son d'atterrissage réussi
function jouerSonAtterrissage() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    sonVictoire.currentTime = 0;
    sonVictoire.play().catch(() => {});
}

// Jouer le son d'explosion
function jouerSonExplosion() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    sonExplosion.currentTime = 0;
    sonExplosion.play().catch(() => {});
}

// Jouer le son d'alerte carburant
function jouerSonAlerte() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    if (audioEtat.alerteActif) return;
    audioEtat.alerteActif = true;

    const oscillateur = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillateur.type = 'square';
    oscillateur.frequency.setValueAtTime(600, audioContext.currentTime);

    gain.gain.setValueAtTime(0.06, audioContext.currentTime);
    gain.gain.setValueAtTime(0, audioContext.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, audioContext.currentTime + 0.16);
    gain.gain.setValueAtTime(0, audioContext.currentTime + 0.24);

    oscillateur.connect(gain);
    gain.connect(audioContext.destination);

    oscillateur.start(audioContext.currentTime);
    oscillateur.stop(audioContext.currentTime + 0.3);

    setTimeout(() => {
        audioEtat.alerteActif = false;
    }, 1500);
}

// Jouer le son d'insertion de pièce
function jouerSonPiece() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const oscillateur = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillateur.type = 'sine';
    oscillateur.frequency.setValueAtTime(1000, audioContext.currentTime);
    oscillateur.frequency.setValueAtTime(1200, audioContext.currentTime + 0.05);
    oscillateur.frequency.setValueAtTime(1400, audioContext.currentTime + 0.1);

    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.setTargetAtTime(0.01, audioContext.currentTime + 0.15, 0.05);

    oscillateur.connect(gain);
    gain.connect(audioContext.destination);

    oscillateur.start(audioContext.currentTime);
    oscillateur.stop(audioContext.currentTime + 0.25);
}


// Constantes du jeu

const LARGEUR_JEU = 1600;
const HAUTEUR_JEU = 450;

canvasJeu.width = LARGEUR_JEU;
canvasJeu.height = HAUTEUR_JEU;

// Physique
const GRAVITE = 1.62;                    // Gravité lunaire (m/s²)
const PUISSANCE_POUSSEE_MAX = 4.0;          // Puissance max du moteur
const ACCELERATION_POUSSEE = 4.0;               // Vitesse d'accélération du moteur
const VITESSE_ANGULAIRE = 90 * Math.PI / 180;  // Vitesse de rotation (rad/s)
const FRICTION_HORIZONTALE = 0.04;            // Friction horizontale

// Carburant
const CARBURANT_INITIAL = 1000;
const CONSOMMATION_CARBURANT_MIN = 4;
const CONSOMMATION_CARBURANT_MAX = 14;
const PENALITE_CARBURANT_MIN = 300;
const PENALITE_CARBURANT_MAX = 350;
const GAIN_CARBURANT_MIN = 50;
const GAIN_CARBURANT_MAX = 50;
const GAIN_CARBURANT_EXTRA = 10;
const SEUIL_ALERTE_CARBURANT = 300;
const MONTANT_CARBURANT_PIECE = 300;

// Atterrissage
const TOLERANCE_ANGLE_ATTERRISSAGE = 6.7 * Math.PI / 180;  // ~6.7 degrés
const TOLERANCE_VITESSE_ATTERRISSAGE = 5.0;

// Apparition
const DECALAGE_APPARITION_HAUT = 50;
const DECALAGE_APPARITION_MILIEU = 170;
const DECALAGE_APPARITION_HORIZONTAL = 80;
const VITESSE_APPARITION_MIN = 30;
const VITESSE_APPARITION_MAX = 50;

// Score
const SCORE_PAR_ATTERRISSAGE = 100;
const CHANCES_MULTIPLICATEUR_SCORE = [0.4, 0.2, 0.15, 0.15, 0.1];

// Pause entre les manches
const PAUSE_ENTRE_MANCHES = 3000;

// Zoom de la caméra
const NIVEAU_ZOOM = 2.5;
const ALTITUDE_ZOOM = 80;
const ALTITUDE_DEZOOM = 100;


// Points du terrain lunaire

const POINTS_TERRAIN = [
    [0, 28], [20, 15], [40, 12], [80, 12], [100, 24],
    [120, 50], [130, 70], [160, 70], [170, 100], [180, 110],
    [200, 150], [220, 140], [240, 135], [270, 135], [280, 100],
    [300, 105], [320, 108], [340, 100], [380, 100], [400, 60],
    [420, 30], [430, 25], [460, 25], [480, 30], [500, 75],
    [520, 80], [540, 100], [560, 120], [600, 120], [620, 160],
    [640, 180], [680, 180], [700, 212], [720, 215], [740, 217],
    [760, 215], [780, 200], [800, 140], [810, 110], [820, 140],
    [850, 140], [860, 70], [880, 10], [920, 10], [930, 15],
    [940, 20], [960, 40], [990, 40], [1000, 65], [1020, 80],
    [1060, 80], [1080, 70], [1100, 72], [1120, 70], [1160, 70],
    [1180, 45], [1200, 20], [1220, 18], [1240, 20], [1280, 20],
    [1300, 80], [1320, 92], [1340, 95], [1380, 95], [1390, 100],
    [1400, 140], [1430, 140], [1440, 130], [1460, 100], [1480, 105],
    [1520, 105], [1540, 108], [1560, 110], [1580, 115], [1600, 117]
];

// Variable de jeu
let dernierTemps = 0;
let deltaTemps = 0;

// État du jeu
let etatJeu = {
    estTermine: true,
    estEnPause: true,
    estEntreManches: false,
    aAtterri: false,
    aDuCarburant: true,
    estEnAlerte: false,
    estZoome: false,
    infoCrash: "",
    changementScore: 0,
    changementCarburant: 0,
    scoreActuel: 0,
    carburantActuel: CARBURANT_INITIAL,
    tempsActuel: 0,
    pieces: 3,
    altitude: 0
};

// Atterrisseur
let atterrisseur = {
    x: 0,
    y: 0,
    rotation: 0,
    vitesseX: 0,
    vitesseY: 0,
    accelerationActuelle: 0,
    visible: false,
    echelle: 12
};

// Contrôles
let commandes = {
    acceleration: false,
    rotationGauche: false,
    rotationDroite: false
};

// Terrain
let segmentsLigne = [];
let differencesHauteur = [];
let multiplicateursScore = [];

// Étoiles
let etoiles = [];

// Particules
let particules = [];

// Caméra
let camera = {
    x: 0,
    y: 0,
    zoom: 1
};

// Initialisation
function init() {
    creerEtoiles();
    chargerTerrain();
    aleatoriserMultiplicateursScore();
}

function creerEtoiles() {
    etoiles = [];
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * LARGEUR_JEU;
        const y = Math.random() * HAUTEUR_JEU;

        // Vérifier que l'étoile n'est pas sous le terrain
        let visible = true;
        for (let j = 0; j < segmentsLigne.length; j++) {
            const seg = segmentsLigne[j];
            if (x >= seg.x1 && x <= seg.x2) {
                const terrainY = HAUTEUR_JEU - seg.y1 - (seg.y2 - seg.y1) * ((x - seg.x1) / (seg.x2 - seg.x1));
                if (y > terrainY - 20) {
                    visible = false;
                }
                break;
            }
        }

        etoiles.push({
            x: x,
            y: y,
            taille: Math.random() * 1.5 + 0.5,
            visible: visible,
            scintillement: Math.random() * Math.PI * 2
        });
    }
}

function chargerTerrain() {
    segmentsLigne = [];
    differencesHauteur = [];

    for (let i = 0; i < POINTS_TERRAIN.length - 1; i++) {
        const p1 = POINTS_TERRAIN[i];
        const p2 = POINTS_TERRAIN[i + 1];

        segmentsLigne.push({
            x1: p1[0],
            y1: p1[1],
            x2: p2[0],
            y2: p2[1]
        });

        differencesHauteur.push(Math.abs(p1[1] - p2[1]));
    }

    // Recréer les étoiles après le terrain
    creerEtoiles();
}

function aleatoriserMultiplicateursScore() {
    multiplicateursScore = [];

    for (let i = 0; i < differencesHauteur.length; i++) {
        if (differencesHauteur[i] > 0.0001) {
            multiplicateursScore.push(0);
            continue;
        }

        // Zone plate - attribuer un multiplicateur
        let p = Math.random();
        let cumul = 0;
        let multiplicateur = 1;

        for (let j = 0; j < CHANCES_MULTIPLICATEUR_SCORE.length; j++) {
            cumul += CHANCES_MULTIPLICATEUR_SCORE[j];
            if (p < cumul) {
                multiplicateur = j + 1;
                break;
            }
        }

        multiplicateursScore.push(multiplicateur);
    }
}

// Contrôles
function onKeyDown(e) {
    if (etatJeu.estTermine && etatJeu.estEnPause) {
        reinitialiserJeu();
        return;
    }

    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        commandes.acceleration = true;
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        commandes.rotationGauche = true;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        commandes.rotationDroite = true;
    }
    if (e.key === 'p' || e.key === 'P') {
        if (!etatJeu.estTermine) {
            etatJeu.estEnPause = !etatJeu.estEnPause;
        }
    }
    if (e.key === 'c' || e.key === 'C') {
        // Insérer une pièce
        if (etatJeu.pieces > 0 && etatJeu.carburantActuel < CARBURANT_INITIAL) {
            etatJeu.pieces--;
            etatJeu.carburantActuel = Math.min(CARBURANT_INITIAL, etatJeu.carburantActuel + MONTANT_CARBURANT_PIECE);
            etatJeu.aDuCarburant = true;
            etatJeu.estEnAlerte = false;
            jouerSonPiece();
        }
    }

    e.preventDefault();
}

function onKeyUp(e) {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        commandes.acceleration = false;
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        commandes.rotationGauche = false;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        commandes.rotationDroite = false;
    }
}

window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);


// Logique du jeu

function reinitialiserJeu() {
    // Initialiser l'audio au premier clic
    demarrerSonMoteur();

    etatJeu.carburantActuel = CARBURANT_INITIAL;
    etatJeu.aDuCarburant = true;
    etatJeu.estEnAlerte = false;
    etatJeu.scoreActuel = 0;
    etatJeu.tempsActuel = 0;
    etatJeu.pieces = 3;
    atterrisseur.visible = true;

    reapparaitre();
}

function reapparaitre() {
    atterrisseur.vitesseX = 0;
    atterrisseur.vitesseY = 0;
    atterrisseur.accelerationActuelle = 0;

    commandes.acceleration = false;
    commandes.rotationGauche = false;
    commandes.rotationDroite = false;

    etatJeu.estTermine = false;
    etatJeu.estEnPause = false;
    etatJeu.estEntreManches = false;

    apparitionAleatoire();
    aleatoriserMultiplicateursScore();
}

function apparitionAleatoire() {
    // Position horizontale aléatoire (éviter le centre)
    let minX, maxX;

    if (Math.random() > 0.5) {
        minX = DECALAGE_APPARITION_HORIZONTAL;
        maxX = LARGEUR_JEU / 2 - 120;
    } else {
        minX = LARGEUR_JEU / 2 + 120;
        maxX = LARGEUR_JEU - DECALAGE_APPARITION_HORIZONTAL;
    }

    atterrisseur.x = Math.random() * (maxX - minX) + minX;

    // Position verticale (en haut de l'écran)
    const minY = DECALAGE_APPARITION_HAUT;
    const maxY = DECALAGE_APPARITION_MILIEU;
    atterrisseur.y = Math.random() * (maxY - minY) + minY;

    // Rotation aléatoire
    atterrisseur.rotation = (Math.random() - 0.5) * Math.PI;

    // vitesse initiale horizontale (vers le centre)
    let vitesseInitiale = Math.random() * (VITESSE_APPARITION_MAX - VITESSE_APPARITION_MIN) + VITESSE_APPARITION_MIN;
    if (atterrisseur.x > LARGEUR_JEU / 2) {
        vitesseInitiale = -vitesseInitiale;
    }
    atterrisseur.vitesseX = vitesseInitiale;
    atterrisseur.vitesseY = 0;
}

function update(dt) {
    if (etatJeu.estTermine || etatJeu.estEntreManches) {
        mettreAJourParticules(dt);
        return;
    }

    if (etatJeu.estEnPause) {
        return;
    }

    etatJeu.tempsActuel += dt;

    gererDeplacement(dt);
    verifierCollision();
    verifierZoom();
    mettreAJourParticules(dt);
}

function gererDeplacement(dt) {
    // Rotation
    if (commandes.rotationGauche) {
        atterrisseur.rotation += VITESSE_ANGULAIRE * dt;
    }
    if (commandes.rotationDroite) {
        atterrisseur.rotation -= VITESSE_ANGULAIRE * dt;
    }

    // Limiter la rotation à ±90°
    atterrisseur.rotation = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, atterrisseur.rotation));

    // Gravité
    atterrisseur.vitesseY += GRAVITE * dt;

    // Propulsion
    if (commandes.acceleration && etatJeu.carburantActuel > 0) {
        atterrisseur.accelerationActuelle += ACCELERATION_POUSSEE * dt;
        atterrisseur.accelerationActuelle = Math.min(atterrisseur.accelerationActuelle, PUISSANCE_POUSSEE_MAX);

        // Consommation de carburant
        const ratio = atterrisseur.accelerationActuelle / PUISSANCE_POUSSEE_MAX;
        const carburantBrule = (ratio * (CONSOMMATION_CARBURANT_MAX - CONSOMMATION_CARBURANT_MIN) + CONSOMMATION_CARBURANT_MIN) * dt;
        etatJeu.carburantActuel -= carburantBrule;

        verifierCarburant();
        verifierAlerteCarburant();

        // Créer des particules de propulsion
        creerParticulesMoteur();
        mettreAJourSonMoteur(atterrisseur.accelerationActuelle);
    } else {
        atterrisseur.accelerationActuelle -= ACCELERATION_POUSSEE * dt * 2;
        atterrisseur.accelerationActuelle = Math.max(0, atterrisseur.accelerationActuelle);
        mettreAJourSonMoteur(0);
    }

    // Direction de la poussée (vers le haut de l’atterrisseur)
    const pousseeX = Math.sin(atterrisseur.rotation) * atterrisseur.accelerationActuelle;
    const pousseeY = -Math.cos(atterrisseur.rotation) * atterrisseur.accelerationActuelle;

    // Friction horizontale
    const frictionX = -atterrisseur.vitesseX * FRICTION_HORIZONTALE;

    // appliquer les forces
    atterrisseur.vitesseX += (pousseeX + frictionX) * dt;
    atterrisseur.vitesseY += pousseeY * dt;

    // Mettre à jour la position
    atterrisseur.x += atterrisseur.vitesseX * dt;
    atterrisseur.y += atterrisseur.vitesseY * dt;
}

function verifierCollision() {
    // Vérifier les bordures
    if (atterrisseur.x < -10 || atterrisseur.x > LARGEUR_JEU + 10 ||
        atterrisseur.y < -10 || atterrisseur.y > HAUTEUR_JEU + 10) {
        etatJeu.infoCrash = "HORS LIMITES";
        etatJeu.aAtterri = false;
        ecrase();
        return;
    }

    // Calculer l'altitude et vérifier les collisions avec le terrain
    const basAtterrisseur = atterrisseur.y + atterrisseur.echelle * 0.6;
    const gaucheAtterrisseur = atterrisseur.x - atterrisseur.echelle * 0.4;
    const droiteAtterrisseur = atterrisseur.x + atterrisseur.echelle * 0.4;

    for (let i = 0; i < segmentsLigne.length; i++) {
        const seg = segmentsLigne[i];

        if (atterrisseur.x >= seg.x1 && atterrisseur.x <= seg.x2) {
            // Calculer la hauteur du terrain à cette position
            const ratio = (atterrisseur.x - seg.x1) / (seg.x2 - seg.x1);
            const hauteurTerrain = seg.y1 + (seg.y2 - seg.y1) * ratio;
            const terrainY = HAUTEUR_JEU - hauteurTerrain;

            // Altitude
            etatJeu.altitude = terrainY - basAtterrisseur;
            etatJeu.altitude = Math.max(0, etatJeu.altitude);

            // Collision détectée
            if (basAtterrisseur >= terrainY - 2) {
                etatJeu.aAtterri = true;

                // Vérifier si trop près du bord
                if (Math.min(atterrisseur.x - seg.x1, seg.x2 - atterrisseur.x) < atterrisseur.echelle * 0.5) {
                    etatJeu.infoCrash = "TROP PRES DU BORD";
                    etatJeu.aAtterri = false;
                }

                // Vérifier le terrain (doit être plat)
                if (differencesHauteur[i] > 0.0001) {
                    etatJeu.infoCrash = "TERRAIN IRREGULIER";
                    etatJeu.aAtterri = false;
                }

                // Vérifier l'angle
                if (Math.abs(atterrisseur.rotation) > TOLERANCE_ANGLE_ATTERRISSAGE) {
                    etatJeu.infoCrash = "ANGLE TROP ELEVE";
                    etatJeu.aAtterri = false;
                }

                // Vérifier la vitesse
                const vitesse = Math.sqrt(atterrisseur.vitesseX ** 2 + atterrisseur.vitesseY ** 2);
                if (vitesse > TOLERANCE_VITESSE_ATTERRISSAGE) {
                    etatJeu.infoCrash = "VITESSE TROP ELEVEE";
                    etatJeu.aAtterri = false;
                }

                if (etatJeu.aAtterri) {
                    atterri(i);
                } else {
                    ecrase();
                }
                return;
            }
            break;
        }
    }
}

function verifierCarburant() {
    if (etatJeu.carburantActuel < 0.0001) {
        etatJeu.carburantActuel = 0;
        etatJeu.aDuCarburant = false;
    } else {
        etatJeu.aDuCarburant = true;
    }
}

function verifierAlerteCarburant() {
    etatJeu.estEnAlerte = etatJeu.carburantActuel < SEUIL_ALERTE_CARBURANT;

    // Jouer le son d'alerte si le carburant devient bas
    if (etatJeu.estEnAlerte && etatJeu.aDuCarburant) {
        jouerSonAlerte();
    }
}

function atterri(indexSegment) {
    const multiplicateur = multiplicateursScore[indexSegment] || 1;
    etatJeu.changementScore = SCORE_PAR_ATTERRISSAGE * multiplicateur;
    etatJeu.scoreActuel += etatJeu.changementScore;

    // Gain de carburant
    etatJeu.changementCarburant = Math.random() * (GAIN_CARBURANT_MAX - GAIN_CARBURANT_MIN) + GAIN_CARBURANT_MIN;
    etatJeu.changementCarburant += GAIN_CARBURANT_EXTRA * multiplicateur;

    const reserveCarburant = CARBURANT_INITIAL - etatJeu.carburantActuel;
    etatJeu.changementCarburant = Math.min(etatJeu.changementCarburant, reserveCarburant);
    etatJeu.carburantActuel += etatJeu.changementCarburant;

    jouerSonAtterrissage();
    prochaineManche();
}

function ecrase() {
    creerParticulesExplosion();

    // pénalité de carburant
    etatJeu.changementCarburant = Math.random() * (PENALITE_CARBURANT_MAX - PENALITE_CARBURANT_MIN) + PENALITE_CARBURANT_MIN;
    etatJeu.changementCarburant = Math.min(etatJeu.changementCarburant, etatJeu.carburantActuel);
    etatJeu.carburantActuel -= etatJeu.changementCarburant;

    etatJeu.changementScore = 0;
    etatJeu.aAtterri = false;

    jouerSonExplosion();
    prochaineManche();
}

function prochaineManche() {
    etatJeu.estEntreManches = true;
    atterrisseur.visible = etatJeu.aAtterri;

    verifierCarburant();
    verifierAlerteCarburant();

    setTimeout(continuerManche, PAUSE_ENTRE_MANCHES);
}

function continuerManche() {
    etatJeu.estEntreManches = false;
    atterrisseur.visible = true;

    if (!etatJeu.aDuCarburant) {
        terminerJeu();
        return;
    }

    reapparaitre();
}

function terminerJeu() {
    etatJeu.estTermine = true;
    etatJeu.estEnPause = true;
    atterrisseur.visible = false;
}

function verifierZoom() {
    if (etatJeu.altitude <= ALTITUDE_ZOOM || (etatJeu.estZoome && etatJeu.altitude <= ALTITUDE_DEZOOM)) {
        zoomer();
    } else if (etatJeu.estZoome && etatJeu.altitude >= ALTITUDE_DEZOOM) {
        dezoomer();
    }
}

function zoomer() {
    etatJeu.estZoome = true;
    camera.x = atterrisseur.x;
    camera.y = atterrisseur.y + etatJeu.altitude / 2;
    camera.zoom = NIVEAU_ZOOM;
}

function dezoomer() {
    etatJeu.estZoome = false;
    camera.x = LARGEUR_JEU / 2;
    camera.y = HAUTEUR_JEU / 2;
    camera.zoom = 1;
}

// particules
function creerParticulesMoteur() {
    const emitX = atterrisseur.x - Math.sin(atterrisseur.rotation) * atterrisseur.echelle * 0.5;
    const emitY = atterrisseur.y + Math.cos(atterrisseur.rotation) * atterrisseur.echelle * 0.5;

    for (let i = 0; i < 3; i++) {
        const angle = atterrisseur.rotation + Math.PI + (Math.random() - 0.5) * 0.3;
        const vitesse = 30 + Math.random() * 40;

        particules.push({
            x: emitX + (Math.random() - 0.5) * 4,
            y: emitY + (Math.random() - 0.5) * 4,
            vx: Math.sin(angle) * vitesse + atterrisseur.vitesseX * 0.3,
            vy: -Math.cos(angle) * vitesse + atterrisseur.vitesseY * 0.3,
            dureeVie: 0.3 + Math.random() * 0.5,
            dureeVieMax: 0.8,
            taille: 2 + Math.random() * 3,
            type: 'poussee'
        });
    }
}

function creerParticulesExplosion() {
    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vitesse = Math.random() * 80;

        particules.push({
            x: atterrisseur.x,
            y: atterrisseur.y,
            vx: Math.cos(angle) * vitesse + atterrisseur.vitesseX * 0.5,
            vy: Math.sin(angle) * vitesse + atterrisseur.vitesseY * 0.5,
            dureeVie: 0.8 + Math.random() * 2,
            dureeVieMax: 3,
            taille: 1 + Math.random() * 4,
            type: 'explosion'
        });
    }
}

function mettreAJourParticules(dt) {
    for (let i = particules.length - 1; i >= 0; i--) {
        const p = particules[i];

        p.vy += GRAVITE * dt;
        p.vx *= (1 - 0.5 * dt);

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.dureeVie -= dt;

        if (p.dureeVie <= 0) {
            particules.splice(i, 1);
        }
    }
}

// Rendu

function render() {
    // Fond noir
    contexte.fillStyle = '#000000';
    contexte.fillRect(0, 0, LARGEUR_JEU, HAUTEUR_JEU);

    // Sauvegarder le contexte pour le zoom
    contexte.save();

    if (etatJeu.estZoome) {
        // Appliquer le zoom centré sur l’atterrisseur
        contexte.translate(LARGEUR_JEU / 2, HAUTEUR_JEU / 2);
        contexte.scale(camera.zoom, camera.zoom);
        contexte.translate(-camera.x, -camera.y);
    }

    // Dessiner les étoiles
    dessinerEtoiles();

    // Dessiner le terrain
    dessinerTerrain();

    // Dessiner les multiplicateurs
    dessinerMultiplicateurs();

    // Dessiner les particules
    dessinerParticules();

    // Dessiner l’atterrisseur
    if (atterrisseur.visible) {
        dessinerAtterrisseur();
    }

    // Dessiner les bordures
    dessinerBordures();

    contexte.restore();

    // Interface (toujours en position fixe)
    dessinerHUD();
}

function dessinerEtoiles() {
    for (const etoile of etoiles) {
        if (!etoile.visible) continue;

        etoile.scintillement += 0.05;
        const luminosite = 0.5 + Math.sin(etoile.scintillement) * 0.3;

        contexte.fillStyle = `rgba(255, 255, 255, ${luminosite})`;
        contexte.fillRect(etoile.x - etoile.taille / 2, etoile.y - etoile.taille / 2, etoile.taille, etoile.taille * 1.5);
    }
}

function dessinerTerrain() {
    contexte.strokeStyle = '#ffffff';
    contexte.lineWidth = 1;
    contexte.beginPath();

    for (let i = 0; i < segmentsLigne.length; i++) {
        const seg = segmentsLigne[i];
        const y1 = HAUTEUR_JEU - seg.y1;
        const y2 = HAUTEUR_JEU - seg.y2;

        if (i === 0) {
            contexte.moveTo(seg.x1, y1);
        }
        contexte.lineTo(seg.x2, y2);
    }

    contexte.stroke();
}

function dessinerMultiplicateurs() {
    if (etatJeu.estTermine) return;

    contexte.fillStyle = '#ffffff';
    contexte.font = '12px Courier New';
    contexte.textAlign = 'center';

    for (let i = 0; i < multiplicateursScore.length; i++) {
        const mul = multiplicateursScore[i];
        if (mul < 2) continue;

        const seg = segmentsLigne[i];
        const x = (seg.x1 + seg.x2) / 2;
        const y = HAUTEUR_JEU - seg.y1 + 15;

        contexte.fillText(`X${mul}`, x, y);
    }
}

function dessinerParticules() {
    for (const p of particules) {
        const alpha = p.dureeVie / p.dureeVieMax;

        if (p.type === 'poussee') {
            // Gradient de couleur jaune -> rouge
            const r = 255;
            const g = Math.floor(255 * alpha);
            const b = Math.floor(128 * alpha);
            contexte.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`;
        } else {
            // Explosion: orange -> rouge
            const r = 240;
            const g = Math.floor(160 * alpha);
            const b = Math.floor(20 * alpha);
            contexte.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`;
        }

        const taille = p.taille * (p.type === 'poussee' ? (0.4 + 0.6 * alpha) : (2 - alpha));
        contexte.fillRect(p.x - taille / 2, p.y - taille / 2, taille, taille);
    }
}

function dessinerAtterrisseur() {
    contexte.save();
    contexte.translate(atterrisseur.x, atterrisseur.y);
    contexte.rotate(atterrisseur.rotation);

    const s = atterrisseur.echelle;

    // Corps principal (capsule)
    contexte.fillStyle = '#cccccc';
    contexte.strokeStyle = '#ffffff';
    contexte.lineWidth = 1;

    // Forme de l’atterrisseur
    contexte.beginPath();
    contexte.moveTo(0, -s * 0.5);                    // Sommet
    contexte.lineTo(-s * 0.35, -s * 0.1);            // Côté gauche haut
    contexte.lineTo(-s * 0.4, s * 0.3);              // Côté gauche bas
    contexte.lineTo(s * 0.4, s * 0.3);               // Côté droit bas
    contexte.lineTo(s * 0.35, -s * 0.1);             // Côté droit haut
    contexte.closePath();
    contexte.fill();
    contexte.stroke();

    // Fenêtre
    contexte.fillStyle = '#4488cc';
    contexte.beginPath();
    contexte.arc(0, -s * 0.15, s * 0.15, 0, Math.PI * 2);
    contexte.fill();
    contexte.strokeStyle = '#ffffff';
    contexte.stroke();

    // Reflet
    contexte.fillStyle = 'rgba(255, 255, 255, 0.4)';
    contexte.beginPath();
    contexte.arc(-s * 0.05, -s * 0.2, s * 0.05, 0, Math.PI * 2);
    contexte.fill();

    // Pieds d'atterrissage
    contexte.strokeStyle = '#888888';
    contexte.lineWidth = 2;

    // Pied gauche
    contexte.beginPath();
    contexte.moveTo(-s * 0.3, s * 0.3);
    contexte.lineTo(-s * 0.5, s * 0.55);
    contexte.stroke();

    // Pied droit
    contexte.beginPath();
    contexte.moveTo(s * 0.3, s * 0.3);
    contexte.lineTo(s * 0.5, s * 0.55);
    contexte.stroke();

    // Patins
    contexte.lineWidth = 3;
    contexte.beginPath();
    contexte.moveTo(-s * 0.6, s * 0.55);
    contexte.lineTo(-s * 0.4, s * 0.55);
    contexte.stroke();

    contexte.beginPath();
    contexte.moveTo(s * 0.4, s * 0.55);
    contexte.lineTo(s * 0.6, s * 0.55);
    contexte.stroke();

    // Moteur
    contexte.fillStyle = '#666666';
    contexte.fillRect(-s * 0.15, s * 0.3, s * 0.3, s * 0.1);

    // Flamme du moteur
    if (atterrisseur.accelerationActuelle > 0.1 && etatJeu.aDuCarburant) {
        const intensiteFlamme = atterrisseur.accelerationActuelle / PUISSANCE_POUSSEE_MAX;
        const longueurFlamme = s * 0.3 + s * 0.5 * intensiteFlamme + Math.random() * s * 0.2;

        const gradient = contexte.createLinearGradient(0, s * 0.4, 0, s * 0.4 + longueurFlamme);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 200, 50, 0.9)');
        gradient.addColorStop(0.7, 'rgba(255, 100, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

        contexte.fillStyle = gradient;
        contexte.beginPath();
        contexte.moveTo(-s * 0.12, s * 0.4);
        contexte.lineTo(0, s * 0.4 + longueurFlamme);
        contexte.lineTo(s * 0.12, s * 0.4);
        contexte.closePath();
        contexte.fill();
    }

    contexte.restore();
}

function dessinerBordures() {
    contexte.strokeStyle = '#ffffff';
    contexte.lineWidth = 1;
    contexte.strokeRect(0, 0, LARGEUR_JEU, HAUTEUR_JEU);
}

function dessinerHUD() {
    contexte.fillStyle = '#ffffff';
    contexte.font = '16px Courier New';

    // Panneau gauche
    contexte.textAlign = 'left';
    const gaucheX = 20;
    const hautY = 30;
    const hauteurLigne = 22;

    contexte.fillText(`SCORE   ${String(etatJeu.scoreActuel).padStart(4, '0')}`, gaucheX, hautY);

    const minutes = Math.floor(etatJeu.tempsActuel / 60);
    const secondes = Math.floor(etatJeu.tempsActuel % 60);
    contexte.fillText(`TEMPS   ${minutes}:${String(secondes).padStart(2, '0')}`, gaucheX, hautY + hauteurLigne);

    contexte.fillText(`CARBURANT ${String(Math.floor(etatJeu.carburantActuel)).padStart(4, '0')}`, gaucheX, hautY + hauteurLigne * 2);

    contexte.fillText(`PIECES  ${etatJeu.pieces}`, gaucheX, hautY + hauteurLigne * 3);

    if (etatJeu.estEnAlerte) {
        contexte.fillStyle = '#ff4444';
        const texteAlerte = etatJeu.aDuCarburant ? 'CARBURANT BAS' : 'PLUS DE CARBURANT';
        contexte.fillText(texteAlerte, gaucheX, hautY + hauteurLigne * 4);
        contexte.fillStyle = '#ffffff';
    }

    // Panneau droit
    contexte.textAlign = 'right';
    const droiteX = LARGEUR_JEU - 20;

    contexte.fillText(`ALTITUDE      ${String(Math.floor(etatJeu.altitude)).padStart(4, '0')}`, droiteX, hautY);
    contexte.fillText(`VITESSE H     ${atterrisseur.vitesseX.toFixed(1).padStart(6, ' ')}`, droiteX, hautY + hauteurLigne);
    contexte.fillText(`VITESSE V     ${(-atterrisseur.vitesseY).toFixed(1).padStart(6, ' ')}`, droiteX, hautY + hauteurLigne * 2);
    contexte.fillText(`ANGLE         ${(-atterrisseur.rotation * 180 / Math.PI).toFixed(1).padStart(6, ' ')}`, droiteX, hautY + hauteurLigne * 3);

    // Panneau central
    contexte.textAlign = 'center';
    const centreX = LARGEUR_JEU / 2;
    const centreY = HAUTEUR_JEU * 0.35;

    if (etatJeu.estTermine && etatJeu.estEnPause) {
        contexte.font = '24px Courier New';
        contexte.fillText('APPUYEZ SUR UNE TOUCHE', centreX, centreY);
        contexte.fillText('POUR JOUER', centreX, centreY + 30);
        contexte.font = '16px Courier New';
        contexte.fillText('FLECHES POUR BOUGER', centreX, centreY + 70);
        contexte.fillText('C POUR INSERER UNE PIECE', centreX, centreY + 95);
    } else if (etatJeu.estEntreManches) {
        contexte.font = '24px Courier New';

        if (etatJeu.aAtterri) {
            contexte.fillText('ALUNISSAGE REUSSI', centreX, centreY);
            contexte.fillText(`${etatJeu.changementScore} POINTS GAGNES`, centreX, centreY + 35);
            contexte.fillText(`${Math.floor(etatJeu.changementCarburant)} CARBURANT GAGNE`, centreX, centreY + 70);
        } else {
            contexte.fillText('MODULE DETRUIT', centreX, centreY);
            contexte.fillText(etatJeu.infoCrash, centreX, centreY + 35);
            contexte.fillText(`${Math.floor(etatJeu.changementCarburant)} CARBURANT PERDU`, centreX, centreY + 70);

            if (!etatJeu.aDuCarburant) {
                contexte.fillStyle = '#ff4444';
                contexte.fillText('GAME OVER', centreX, centreY + 110);

                if (etatJeu.pieces > 0) {
                    contexte.fillStyle = '#ffcc00';
                    contexte.font = '18px Courier New';
                    contexte.fillText(`APPUYEZ C POUR CONTINUER (${etatJeu.pieces} PIECES)`, centreX, centreY + 145);
                }
            }
        }
    } else if (etatJeu.estEnPause && !etatJeu.estTermine) {
        contexte.font = '24px Courier New';
        contexte.fillText('PAUSE', centreX, centreY);
        contexte.font = '16px Courier New';
        contexte.fillText('APPUYEZ P POUR CONTINUER', centreX, centreY + 35);
    }
}


// Boucle principale

function boucleJeu(tempsActuel) {
    if (dernierTemps === 0) {
        dernierTemps = tempsActuel;
    }

    deltaTemps = (tempsActuel - dernierTemps) / 1000;
    dernierTemps = tempsActuel;

    // limiter deltaTemps pour éviter les bugs
    deltaTemps = Math.min(deltaTemps, 0.1);

    update(deltaTemps);
    render();

    requestAnimationFrame(boucleJeu);
}

// démarrage

init();
camera.x = LARGEUR_JEU / 2;
camera.y = HAUTEUR_JEU / 2;
requestAnimationFrame(boucleJeu);

