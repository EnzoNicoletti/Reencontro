/**
 * Development-only script to populate Firestore with fictional demonstration reports.
 *
 * Prerequisites:
 * 1. Email/Password auth enabled in Firebase Console (Authentication > Sign-in method)
 *    and a verified test account created, OR use the in-app "Carregar dados de demonstração"
 *    button in /perfil while signed in with Google.
 * 2. Run with:
 *    SEED_EMAIL="seu@email.com" SEED_PASSWORD="suasenha" node scripts/seedDemoReports.mjs
 */

import fs from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import { geohashForLocation } from 'geofire-common';
import { DEMO_REPORTS } from '../src/utils/demoData.js';

const firebaseConfig = JSON.parse(
  fs.readFileSync(new URL('../firebase-applet-config.json', import.meta.url), 'utf8')
);

const email = process.env.SEED_EMAIL;
const password = process.env.SEED_PASSWORD;

if (!email || !password) {
  console.error('Defina SEED_EMAIL e SEED_PASSWORD para executar o script de seed.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function main() {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  if (!user.emailVerified) {
    console.warn('Atenção: o usuário de seed precisa ter e-mail verificado para gravar no Firestore.');
  }

  for (const item of DEMO_REPORTS) {
    const geohash = geohashForLocation([item.lat, item.lng]);
    await setDoc(doc(db, 'reports', item.reportId), {
      ...item,
      userId: user.uid,
      authorName: user.displayName || 'Voluntário Reencontro',
      authorPhotoURL: user.photoURL || '',
      geohash,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`Relato criado: ${item.reportId}`);
  }

  console.log('Seed de demonstração concluído com sucesso.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Falha ao popular relatos de demonstração:', err);
  process.exit(1);
});
