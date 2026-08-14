#!/bin/bash

# Find where `const addEpisodeRow = () => {` is
# and insert `const [showAutoAddModal, setShowAutoAddModal] = useState(false);`
# `const [autoAddConfig, setAutoAddConfig] = useState({ startEp: 1, endEp: 12, anilistId: anime?.aniListId || '', malId: '' });`

