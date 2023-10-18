const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { text } = require('body-parser');

const app = express();
const port = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());

app.post('/upload', upload.single('csvFile'), (req, res) => {
    
    if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier téléchargé.' });
    }

    const lines = req.file.buffer.toString().split('\n').filter(line => line.trim() !== "");

    let balance = 0;
    const salaryTransactions = [];

    // Extrait le solde du compte de la colonne 5 de la première ligne (ligne 0)
    const firstLine = lines[0].split(';');
    if (firstLine.length >= 5) {
        balance = parseFloat(firstLine[4].replace(/[\s,]/g, ''));
    }

    const transactions = [];

    for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(';');
        const lastColumn = columns[columns.length - 1].trim();

        if (lastColumn.includes('IBF FRANCE /MOTIF SALAIRE')) {
            const amount = parseFloat(lastColumn.replace(/[^\d.-]/g, ''));
            salaryTransactions.push({
                date: columns[0],
                amount: amount,
            });
        }

        transactions.push({
            date: columns[0],
            description: columns[1],
            category: columns[2],
            marchant: columns[3].replace(/\s+/g, ' ').trim(),
            amount: columns[4],
        });
    }

    const result = {
        balance: balance.toFixed(2),
        salaryTransactions: salaryTransactions,
        allTransactions: transactions,
    };

    res.json(result);
});

app.listen(port, () => {
    console.log(`Le serveur est en cours d'exécution sur http://localhost:${port}`);
});
