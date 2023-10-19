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
        return res.status(400).json({ error: 'No CSV File received' });
    }

    const lines = req.file.buffer.toString().split('\n').filter(line => line.trim() !== "");

    let balance = 0;
    const salaryTransactions = [];
    const placementTransactions = [];

    // Extrait le solde du compte de la colonne 5 de la première ligne (ligne 0)
    const firstLine = lines[0].split(';');
    balance = firstLine[8];

    const transactions = [];

    for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(';');
        const lastColumn = columns[columns.length - 1].trim();

        switch (true) {
            case columns[3].includes('MOTIF SALAIRE'):
                salaryTransactions.push({
                    date: columns[0],
                    type: columns[1],
                    compagny: columns[3].match(/\/DE\s+(.*?)\s*\/MOTIF/)[1],
                    amount: columns[4],
                });

            case columns[3].includes('VIR CPTE A CPTE EMIS'):
                console.log('notok');
            default:
                console.log("default");
          }

        if (columns[3].includes('VIR CPTE A CPTE EMIS')) {
            placementTransactions.push({
                date: columns[0],
                type: columns[1],
                to: columns[3].match(/\/BEN\s+(.*?)\s*\/REF/)[1],
                amount: columns[4],
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
        currentBalance: balance,
        salaryTransactions: salaryTransactions,
        placementTransactions: placementTransactions,
        allTransactions: transactions,
    };

    res.json(result);
});

app.listen(port, () => {
    console.log(`Listen on port ${port}`);
});
