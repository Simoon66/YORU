const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace text-white with text-yoru-bg on bg-yoru-accent items
    content = content.replace(/bg-yoru-accent(.*?)text-white/g, 'bg-yoru-accent$1text-yoru-bg');
    content = content.replace(/text-white(.*?)bg-yoru-accent/g, 'text-yoru-bg$1bg-yoru-accent');
    
    if (content !== original) {
        fs.writeFileSync(file, content);
    }
});
console.log('Done replacing colors.');
