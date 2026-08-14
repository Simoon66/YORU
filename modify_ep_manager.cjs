const fs = require('fs');

let content = fs.readFileSync('src/pages/Admin/EpisodeManager.tsx', 'utf8');

// Add autoAdd state
content = content.replace(
  "const [seasonToDelete, setSeasonToDelete] = useState<string | null>(null);",
  "const [seasonToDelete, setSeasonToDelete] = useState<string | null>(null);\n  const [showAutoAddModal, setShowAutoAddModal] = useState(false);\n  const [autoAddConfig, setAutoAddConfig] = useState({ startEp: 1, endEp: 12, anilistId: '', malId: '' });"
);

// Populate anilistId initially
content = content.replace(
  "setSeasons(data.seasons || [{ id: 's1', name: 'Season 1', order: 1 }]);",
  "setSeasons(data.seasons || [{ id: 's1', name: 'Season 1', order: 1 }]);\n        setAutoAddConfig(prev => ({ ...prev, anilistId: data.aniListId || '' }));"
);

// Add addEpisodeRow serverType
content = content.replace(
  "serverName: 'HD-1',",
  "serverName: 'HD-1',\n      serverType: 'sub',"
);

// Add handleAutoGenerate function
const handleAutoGenerateFn = `
  const handleAutoGenerate = () => {
    const { startEp, endEp, anilistId, malId } = autoAddConfig;
    const newEpisodes: Partial<Episode>[] = [];
    
    for (let i = startEp; i <= endEp; i++) {
      if (anilistId) {
        newEpisodes.push({
          id: \`temp_\${Date.now()}_\${i}_ani_sub\`,
          animeId: id,
          seasonId: activeSeason,
          episodeNumber: i,
          title: \`Episode \${i}\`,
          embedLink: \`https://megaplay.buzz/stream/ani/\${anilistId}/\${i}/sub\`,
          serverName: 'HD-1',
          serverType: 'sub',
          thumbnailUrl: anime?.backdrop || '',
          isFiller: false,
          published: true
        });
        newEpisodes.push({
          id: \`temp_\${Date.now()}_\${i}_ani_dub\`,
          animeId: id,
          seasonId: activeSeason,
          episodeNumber: i,
          title: \`Episode \${i}\`,
          embedLink: \`https://megaplay.buzz/stream/ani/\${anilistId}/\${i}/dub\`,
          serverName: 'HD-1',
          serverType: 'dub',
          thumbnailUrl: anime?.backdrop || '',
          isFiller: false,
          published: true
        });
      }
      
      if (malId) {
        newEpisodes.push({
          id: \`temp_\${Date.now()}_\${i}_mal_sub\`,
          animeId: id,
          seasonId: activeSeason,
          episodeNumber: i,
          title: \`Episode \${i}\`,
          embedLink: \`https://megaplay.buzz/stream/mal/\${malId}/\${i}/sub\`,
          serverName: 'HD-2',
          serverType: 'sub',
          thumbnailUrl: anime?.backdrop || '',
          isFiller: false,
          published: true
        });
        newEpisodes.push({
          id: \`temp_\${Date.now()}_\${i}_mal_dub\`,
          animeId: id,
          seasonId: activeSeason,
          episodeNumber: i,
          title: \`Episode \${i}\`,
          embedLink: \`https://megaplay.buzz/stream/mal/\${malId}/\${i}/dub\`,
          serverName: 'HD-2',
          serverType: 'dub',
          thumbnailUrl: anime?.backdrop || '',
          isFiller: false,
          published: true
        });
      }
    }
    
    setEpisodes(prev => [...prev, ...newEpisodes]);
    setShowAutoAddModal(false);
  };
`;
content = content.replace(
  "const handleAddSeason = () => {",
  handleAutoGenerateFn + "\n  const handleAddSeason = () => {"
);

// Add "Auto Add Episodes" button
content = content.replace(
  /<button onClick=\{addEpisodeRow\}/g,
  '<button onClick={() => setShowAutoAddModal(true)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yoru-accent hover:text-yoru-accent/80 transition-colors mr-2">\n                <Plus className="w-4 h-4" /> Auto Add\n              </button>\n              <button onClick={addEpisodeRow}'
);

// Add serverType column to table headers
content = content.replace(
  '<th className="pb-4 font-bold w-32">Server</th>',
  '<th className="pb-4 font-bold w-32">Server</th>\n                <th className="pb-4 font-bold w-24">Type</th>'
);

// Add serverType column to table rows
content = content.replace(
  '<td className="py-2 pr-2 text-center">',
  `                  <td className="py-2 pr-2">
                    <select
                      value={ep.serverType || 'sub'}
                      onChange={e => updateEpisode(ep.id!, 'serverType', e.target.value)}
                      className="w-full bg-yoru-bg border border-yoru-border px-3 py-2 text-white focus:outline-none focus:border-yoru-accent"
                    >
                      <option value="sub">SUB</option>
                      <option value="dub">DUB</option>
                      <option value="multi">MULTI</option>
                    </select>
                  </td>
                  <td className="py-2 pr-2 text-center">`
);

// Add Auto Add Modal
const autoAddModal = `
      {showAutoAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-yoru-surface border border-yoru-border max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-white mb-2">Auto Add Episodes</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">Start Ep</label>
                <input 
                  type="number" 
                  value={autoAddConfig.startEp} 
                  onChange={e => setAutoAddConfig({...autoAddConfig, startEp: parseInt(e.target.value) || 1})}
                  className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">End Ep</label>
                <input 
                  type="number" 
                  value={autoAddConfig.endEp} 
                  onChange={e => setAutoAddConfig({...autoAddConfig, endEp: parseInt(e.target.value) || 12})}
                  className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">Anilist ID (For HD-1)</label>
                <input 
                  type="text" 
                  value={autoAddConfig.anilistId} 
                  onChange={e => setAutoAddConfig({...autoAddConfig, anilistId: e.target.value})}
                  className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">MAL ID (For HD-2)</label>
                <input 
                  type="text" 
                  value={autoAddConfig.malId} 
                  onChange={e => setAutoAddConfig({...autoAddConfig, malId: e.target.value})}
                  className="w-full bg-yoru-bg border border-yoru-border px-4 py-2 text-sm text-white focus:outline-none focus:border-yoru-accent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button 
                onClick={() => setShowAutoAddModal(false)}
                className="px-4 py-2 text-sm font-bold uppercase tracking-widest text-yoru-text-muted hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAutoGenerate}
                className="bg-yoru-accent hover:bg-yoru-accent/90 text-yoru-bg px-6 py-2 text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace("    </div>\n  );\n};\n", autoAddModal + "    </div>\n  );\n};\n");

fs.writeFileSync('src/pages/Admin/EpisodeManager.tsx', content);
