const APIController = (function(){

    const clientId = '99b02cbb5b4f4093a8f331f4a3cfa7fe';
    const clientSecret = '8c4f2385a3214855b69bd2007242cb04';

    //вземане на Токен и оторизация според документацията на Spotify API
    const _getToken = async () =>{
        //console.log( btoa(clientId + ':' + clientSecret) );
        const result = await fetch('https://accounts.spotify.com/api/token',{
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Authorization' : 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        const data = await result.json();
        //console.log( data.access_token );
        return data.access_token;
    }
    //методи GET за вземане на информация от EndPoint of Spotify
    const _getGenres = async (token) => {

        const result = await fetch(`https://api.spotify.com/v1/browse/categories?locale=sv_US`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data.categories.items;
    }

    const _getPlaylistByGenre = async (token, genreId) => {

        const limit = 20;
    
        const result = await fetch(`https://api.spotify.com/v1/browse/categories/${genreId}/playlists?limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data.playlists.items;
    }

    const _getTracks = async (token, tracksEndPoint) => {

        const limit = 50;

        const result = await fetch(`${tracksEndPoint}?limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data.items;
    }

    const _getTrack = async (token, trackEndPoint) => {

        const result = await fetch(`${trackEndPoint}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data;
    }

    return {
        getToken() {
            return _getToken();
        },
        getGenres(token) {
            return _getGenres(token);
        },
        getPlaylistByGenre(token, genreId) {
            return _getPlaylistByGenre(token, genreId);
        },
        getTracks(token, tracksEndPoint) {
            return _getTracks(token, tracksEndPoint);
        },
        getTrack(token, trackEndPoint) {
            return _getTrack(token, trackEndPoint);
        }
    }
})();


const UIController = (function() {

    //създаване на обект са съхранение на препратка към music-world.html
    const DOMElements = {
        selectGenre: '#select_genre',
        selectPlaylist: '#select_playlist',
        buttonSubmit: '#btn_submit',
        divSongDetail: '#song-detail',
        hfToken: '#hidden_token',
        divSonglist: '.song-list'
    }

    return {

        //полета за въвеждане
        inputField() {
            return {
                genre: document.querySelector(DOMElements.selectGenre),
                playlist: document.querySelector(DOMElements.selectPlaylist),
                tracks: document.querySelector(DOMElements.divSonglist),
                submit: document.querySelector(DOMElements.buttonSubmit),
                songDetail: document.querySelector(DOMElements.divSongDetail)
            }
        },

        //лист с жанр
        createGenre(text, value) {
            const html = `<option value="${value}">${text}</option>`;
            document.querySelector(DOMElements.selectGenre).insertAdjacentHTML('beforeend', html);
        }, 
        //плейлист
        createPlaylist(text, value) {
            const html = `<option value="${value}">${text}</option>`;
            document.querySelector(DOMElements.selectPlaylist).insertAdjacentHTML('beforeend', html);
        },

        //лист с песни 
        createTrack(id, name) {
            const html = `<a href="#" class="list-group-item list-group-item-action list-group-item-light" id="${id}">${name}</a>`;
            document.querySelector(DOMElements.divSonglist).insertAdjacentHTML('beforeend', html);
        },

        //детайли за песните
        createTrackDetail(img, title, artist) {
            const detailDiv = document.querySelector(DOMElements.divSongDetail);
            detailDiv.innerHTML = '';
            const html = 
                `
                <div class="row col-sm-12 pb-2 pt-2 align-items-center justify-content-center bg-white">
                    <img src="${img}" alt style="width: 100px;">        
                </div>
                <div class="row col-sm-12 px-0 bg-white text-darck">
                    <label for="Genre" class="form-label col-sm-12">${title}:</label>
                </div>
                <div class="row col-sm-12 px-0 bg-white text-darck">
                    <label for="artist" class="form-label col-sm-12">By ${artist}</label>
                </div> 
                 `;

        detailDiv.insertAdjacentHTML('beforeend', html)
        },
        //reset-и за премахване на стари данни при следващ клик
        resetTrackDetail() {
            this.inputField().songDetail.innerHTML = '';
        },

        resetTracks() {
            this.inputField().tracks.innerHTML = '';
            this.resetTrackDetail();
        },

        resetPlaylist() {
            this.inputField().playlist.innerHTML = '';
            this.resetTracks();
        },
        //за запазване на токен
        storeToken(value) {
            document.querySelector(DOMElements.hfToken).value = value;
        },
        //за използване на запазения токен
        getStoredToken() {
            return {
                token: document.querySelector(DOMElements.hfToken).value
            }
        }
    }

})();

const APPController = (function(UICtrl, APICtrl) {

    //референция към полетата
    const DOMInputs = UICtrl.inputField();

    //получаване на жанровете при зареждане на страницата
    const loadGenres = async () => {
        //вземане на токен
        const token = await APICtrl.getToken();           
        //запазване на токена
        UICtrl.storeToken(token);
        //вземане на жанрове
        const genres = await APICtrl.getGenres(token);
        //попълване на жанровете
        genres.forEach(element => UICtrl.createGenre(element.name, element.id));
    }

    //event listener при избор на жанр взема плейлистите за този жанр
    DOMInputs.genre.addEventListener('change', async () => {
        //нулиране на избран плейлист
        UICtrl.resetPlaylist();
        //вземане на запазен токен
        const token = UICtrl.getStoredToken().token;        
        //вземане на жанр
        const genreSelect = UICtrl.inputField().genre;       
        //вземане на Id на избрания жанр
        const genreId = genreSelect.options[genreSelect.selectedIndex].value;             
        //вземане на плейлисти по избран жанр
        const playlist = await APICtrl.getPlaylistByGenre(token, genreId);       
        //създаване на лист с песни по избран плейлист
        playlist.forEach(p => UICtrl.createPlaylist(p.name, p.tracks.href));
    });
 
    //click event listener за следене на клик върху бутона Search
    DOMInputs.submit.addEventListener('click', async (e) => {
        //предотвратява reset на страницата
        e.preventDefault();
        //нулира избрани песни
        UICtrl.resetTracks();
        //вземане на запазения токен
        const token = UICtrl.getStoredToken().token;        
        //селектиране на плейлиста
        const playlistSelect = UICtrl.inputField().playlist;
        //намиране на песните в избрания плейлист 
        const tracksEndPoint = playlistSelect.options[playlistSelect.selectedIndex].value;
        //вземане на намерените песни
        const tracks = await APICtrl.getTracks(token, tracksEndPoint);
        //създаване на лист с песни
        tracks.forEach(el => UICtrl.createTrack(el.track.href, el.track.name))
    });

    //click event listener за следене на клик върху песен 
    DOMInputs.tracks.addEventListener('click', async (e) => {
        //предотвратява reset на страницата
        e.preventDefault();
        //нулира детайли за избрани песни
        UICtrl.resetTrackDetail();
        //вземане на запазения токен
        const token = UICtrl.getStoredToken().token;
        //намиране на избраната песен
        const trackEndpoint = e.target.id;
        //вземане на данните на избраната песен
        const track = await APICtrl.getTrack(token, trackEndpoint);
        //зареждане на детайлите на избраната песен
        UICtrl.createTrackDetail(track.album.images[2].url, track.name, track.artists[0].name);
    });    

    return {
        init() {
            console.log('App is starting');
            loadGenres();
        }
    }
//незабавно извикване
})(UIController, APIController);

//зареждане на жанровете при зареждане на страницата
APPController.init();