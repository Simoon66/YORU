const axios = require('axios');
axios.get('https://api.allorigins.win/raw?url=https%3A%2F%2Fanikotoapi.site%2Frecent-anime')
  .then(res => console.log(res.data.data[0].title))
  .catch(err => console.error(err.response ? err.response.status : err.message));
