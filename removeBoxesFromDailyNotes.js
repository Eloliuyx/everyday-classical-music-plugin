const fs = require('fs');
const path = require('path');
const moment = require('moment');

const vaultPath = '/Users/eloliu/Obsidian/Elo\'s Vault';
const dailyNotesFolder = path.join(vaultPath, 'Daily Note');
const blockPatterns = ['[!tip]', '[!info]', '[!quote]'];

// Function to remove all the specified boxes from the daily notes
async function removeBoxesFromDailyNotes() {
    const files = fs.readdirSync(dailyNotesFolder);

    for (const file of files) {
        if (file.endsWith('.md') && moment(file.slice(0, 10), 'YYYY-MM-DD', true).isValid()) {
            const filePath = path.join(dailyNotesFolder, file);
            let content = fs.readFileSync(filePath, 'utf-8');

            // Split the content into lines
            let lines = content.split('\n');
            let newLines = [];
            let inBlock = false;

            for (let line of lines) {
                if (blockPatterns.some(pattern => line.includes(pattern))) {
                    inBlock = true; // Start of block
                    continue; // Skip the block pattern line
                } else if (inBlock && line.startsWith('> ')) {
                    continue; // Skip lines within the block
                } else if (inBlock && !line.startsWith('> ')) {
                    inBlock = false; // End of block
                }
                newLines.push(line);
            }

            // Join the new lines and write the cleaned content back to the file
            let cleanedContent = newLines.join('\n').replace(/[\r\n]+/g, '\n').trim();
            fs.writeFileSync(filePath, cleanedContent, 'utf-8');
            console.log(`Cleaned: ${file}`);
        }
    }
}

removeBoxesFromDailyNotes();
