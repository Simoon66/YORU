import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, orderBy, limit, getDocs } from "firebase/firestore";

import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf-8');
// This is tedious to parse.
