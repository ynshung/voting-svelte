/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall } from "firebase-functions/v2/https"; 
import { beforeUserCreated, HttpsError } from "firebase-functions/v2/identity";
  
// import * as logger from "firebase-functions/logger";
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from "firebase-admin/database";
import { setGlobalOptions } from "firebase-functions/v2/options";

const app = initializeApp();
const db = getDatabase(app);

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

setGlobalOptions({ region: "us-central1", maxInstances: 10, concurrency: 200 });

const AUTHORIZED_LIST = "https://docs.google.com/spreadsheets/d/e/GSHEET_ID/pub?output=csv";

const checkEmail = async (email: string) => {
    // if (!email.includes('@authorized-domain.com')) {
    //     return false;
    // }
    
    const response = await fetch(AUTHORIZED_LIST);
    const text = await response.text();
    return text.includes(email);
};

export const blockUnauthorized = beforeUserCreated((event) => {
    const user = event.data;  

    if (user.email) {
      checkEmail(user.email).then((result) => {
        if (!result) {
          throw new HttpsError('permission-denied', "Unauthorized email");
        }
      }).catch((error) => {
        throw new HttpsError('internal', `Error occurred: ${error}`);
      });
    }
});

export const checkAuthorized = onCall(async (request) => {
    const email: string = request.data.email;
    
    return checkEmail(email).then((result) => {
      return result;
    }).catch((error) => {
      throw new HttpsError('internal', `Error occurred: ${error}`);
    });
});

export const voteCandidate = onCall(async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Unauthenticated');
      }
  
      const uid = request.auth.uid;
      const ballot: string = request.data.ballot;
      const candidate: string = request.data.candidate;
  
      const voterRef = db.ref(`voted/${uid}`);
      const snapshot = await voterRef.once('value');
      const data: Record<string, boolean> = snapshot.val();
  
      if (data && data[ballot]) {
        throw new HttpsError('already-exists', 'You have already voted.');
      }
  
      const candidateRef = db.ref(`ballots/${ballot}/votes/${candidate}`);
      const votesSnapshot = await candidateRef.once('value');
      const votes = votesSnapshot.val();
  
      if (votes === null) {
        throw new HttpsError('not-found', 'Candidate not found.');
      }
  
      await candidateRef.set(votes + 1);
      await voterRef.update({ [ballot]: true });
  
      return {
        status: 'success',
        message: 'Voted successfully',
      };
    } catch (error: any) {
      if (error instanceof HttpsError) {
        throw error;
      } else {
        throw new HttpsError('internal', `Internal error - ${error.message}`);
      }
    }
  });
  
