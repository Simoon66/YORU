#!/bin/bash
cat << 'REPLACE' > tmp_replace
        {/* 3. Server Selector */}
        <div className="flex flex-col gap-6 mt-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-yoru-text-muted flex items-center gap-2 border-b border-white/5 pb-2">
              <Server className="w-4 h-4" /> Servers
            </span>
            <div className="flex flex-col gap-4">
              {['sub', 'dub', 'multi'].map((type) => {
                const serversOfType = currentEpisodeServers.filter(ep => (ep.serverType === type) || (!ep.serverType && type === 'sub'));
                if (serversOfType.length === 0) return null;
                return (
                  <div key={type} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white/50 w-16">
                      {type}:
                    </span>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {serversOfType.map(serverEp => (
                        <button
                          key={serverEp.id}
                          onClick={() => handleServerChange(serverEp.id)}
                          className={clsx(
                            "min-h-[40px] px-5 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-200 ease-out border",
                            currentEpisode.id === serverEp.id
                              ? "bg-yoru-accent text-[#030407] border-yoru-accent shadow-[0_4px_10px_rgba(226,232,240,0.2)] scale-100"
                              : "bg-yoru-surface-elevated text-yoru-text-muted border-white/5 hover:text-white hover:border-white/20 hover:-translate-y-[2px] active:scale-[0.98]"
                          )}
                        >
                          {serverEp.serverName || 'Default'}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
REPLACE

sed -i -e '/{\/\* 3\. Server Selector \*\/}/,/<div className="flex flex-col gap-4 mt-4">/!b' \
    -e '/<div className="flex flex-col gap-4 mt-4">/!d' \
    -e '/<div className="flex flex-col gap-4 mt-4">/r tmp_replace' \
    -e 'x;$!d' src/pages/Watch.tsx

# Actually let's use a simpler way
