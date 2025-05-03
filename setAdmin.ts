import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

process.env['GOOGLE_APPLICATION_CREDENTIALS'] = 'serviceAccountKey.json';

const app = initializeApp({
  credential: applicationDefault(),
});

async function addAdmin(email: string): Promise<void> {
  const user = await getAuth(app).getUserByEmail(email);
  await getAuth(app).setCustomUserClaims(user.uid, { admin: true });
  console.log(`User ${email} has been granted admin privileges.`);
}

async function removeAdmin(email: string): Promise<void> {
  const user = await getAuth(app).getUserByEmail(email);
  await getAuth(app).setCustomUserClaims(user.uid, { admin: false });
  console.log(`Admin privileges have been removed from user ${email}.`);
}

async function checkAdmin(email: string): Promise<void> {
  const user = await getAuth(app).getUserByEmail(email);
  const claims = user.customClaims || {};
  if (claims.admin) {
    console.log(`User ${email} is an admin.`);
  } else {
    console.log(`User ${email} is not an admin.`);
  }
}

async function listAdmins(): Promise<void> {
  const listUsersResult = await getAuth(app).listUsers();
  const admins = listUsersResult.users.filter(user => user.customClaims?.admin);
  if (admins.length === 0) {
    console.log('No admins found.');
  } else {
    console.log('Admins:');
    admins.forEach(admin => console.log(`- ${admin.email}`));
  }
}

// Example usage: Read from command-line arguments
const [action, email] = process.argv.slice(2);

if (!email && action !== 'list') {
  console.error('Please provide an email address.');
  process.exit(1);
}

(async () => {
  try {
    if (action === 'add') {
      await addAdmin(email);
    } else if (action === 'remove') {
      await removeAdmin(email);
    } else if (action === 'check') {
      await checkAdmin(email);
    } else if (action === 'list') {
      await listAdmins();
    } else {
      console.error('Invalid action. Use "add", "remove", "check", or "list".');
    }
  } catch (error) {
    console.error('Error:', error);
  }
})();
