import { collection, doc, getDocs, limit, query, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const mockBreaches = [
    {
        email: 'test@example.com',
        breaches: [
            { Name: 'Adobe', Domain: 'adobe.com', BreachDate: '2013-10-04' },
            { Name: 'LinkedIn', Domain: 'linkedin.com', BreachDate: '2012-05-05' }
        ]
    },
    {
        email: 'user@gmail.com',
        breaches: [
            { Name: 'Canva', Domain: 'canva.com', BreachDate: '2019-05-24' }
        ]
    },
    {
        email: 'admin@company.com',
        breaches: [
            { Name: 'Dropbox', Domain: 'dropbox.com', BreachDate: '2012-07-01' },
            { Name: 'MySpace', Domain: 'myspace.com', BreachDate: '2013-02-01' },
            { Name: 'Ashley Madison', Domain: 'ashleymadison.com', BreachDate: '2015-07-01' }
        ]
    }
];

export const seedBreachData = async () => {
    try {
        const breachesRef = collection(db, 'breaches');
        const q = query(breachesRef, limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            console.log('Breach data already exists, skipping seed.');
            return;
        }

        console.log('Seeding mock breach data...');
        for (const data of mockBreaches) {
            const docRef = doc(db, 'breaches', data.email.toLowerCase());
            await setDoc(docRef, {
                email: data.email.toLowerCase(),
                breaches: data.breaches
            });
        }
        console.log('Seeding complete!');
    } catch (error) {
        console.error('Error seeding breach data:', error);
    }
};
