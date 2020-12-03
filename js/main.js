////Client ID 99b02cbb5b4f4093a8f331f4a3cfa7fe

//Client Secret 8c4f2385a3214855b69bd2007242cb04

//https://accounts.spotify.com/authorize


//https://accounts.spotify.com/api/token
//private methods
const APIControler = (function(){

    const clientId = '99b02cbb5b4f4093a8f331f4a3cfa7fe';
    const clientSecret = '8c4f2385a3214855b69bd2007242cb04';

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
        console.log( data.access_token );
        return data.access_token;
    }

    const _getGenres = async (token) => {

        const result = await fetch(`https://api.spotify.com/v1/browse/categories?locale=sv_US`,{
            method: 'GET',
            headers: {'Authorization' : 'Bearer ' + token}
        });
        
        const data = await result.json();
        return data.categories.items;
    }

    const _getPlaylistByGenre = async (token, genreId) => {

        const limit = 10;

        const result = await fetch(`https://api.sporify.com/v1/browse/categories/${genreId}/playlists?limit=${limit}`,{
            method: 'GET',
            headers: {'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data.playlists.items;

    }
    const _getTracks = async (token, tracksEndPoint) => {

        const limit = 10;
        
        const result = await fetch(`${tracksEndPoint}?limit=${limit}`,{
            method: 'GET',
            headers: {'Authorization' : 'Bearer ' + token}
        });

        const data = result.json();
        return data.items;
    }
    const _getTrack = async (token, trackEndPoint) => {

        const result = await fetch(`${trackEndPoint}`, {
            method: 'GET',
            headers: {'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data;
    }

    return{
        getToken(){
            return _getToken();
        },
        getGenres(token){
            return _getGenres(token);
        },
        getPlaylistByGenre(token, genreId){
            return _getPlaylistByGenre(token, genreId);
        },
        getTracks(token, tracksEndPoint){
            return _getTracks(token, tracksEndPoint);
        },
        getTrack(token, trackEndPoint){
            return _getTrack(token, trackEndPoint);
        }
    }

})();
// UI Module
const UIControler = (function() {
    //object to hold referencec to html selectors
    const DOMElements = {
        selectGenre: '#select_genre',
        selectPlaylist: '#select_playlist',
        buttonSubmit: '#btn_submit',
        divSongDetail: '#song-detail',
        hfToken: '#hidden_token',
        divSonglist: '.song-list'
    }
    //public method
    return{
        //method to get input fields
        inputField() {
            return{
                genre: document.querySelector(DOMElements.selectGenre),
                playlist: document.querySelector(DOMElements.selectPlaylist),
                tracks: document.querySelector(DOMElements.divSonglist),
                submit: document.querySelector(DOMElements.buttonSubmit),
                songDetail: document.querySelector(DOMElements.divSongDetail)
            }
        },
        //need method to create select list option
        createGenre(text, value){
            const html = `<option value="${value}">${text}</option>`;
            document.querySelector(DOMElements.selectGenre).insertAdjacentHTML('beforeend', html);
        },

        createPlaylist(text, value){
            const html = `<option value="${value}">${text}</option>`;
            document.querySelector(DOMElements.selectPlaylist).insertAdjacentHTML('beforeend', html);
        },
        //need method to create a track list group item 
        createTrack(id, name){
            const html = `<a href="#" class="list-group-item list-group-item-action list-group-item-light" id="${id}">${name}</a>`;
            document.querySelector(DOMElements.divSonglist).insertAdjacentHTML('beforeend', html);
        },
        //need method to create the song detail
        createSongDetail(img, title, artist){

            const detailDiv = document.querySelector(DOMElements.divSongDetail);
            //any time user click a new song, we need to clear out song detail
            detailDiv.innerHTML = '';

            const html =
            `
            <div class="row col-sm-12 px-0">
                <img src="${img}" alt="">
            </div>
            <div class="row col-sm-12 px-0">
                <label for="Genre" class="form-label col-sm-12">${title}:</label>
            </div>
            <div class="row col-sm-12 px-0">
                <label for="Genre" class="form-label col-sm-12">By ${artist}:</label>
            </div>
            `;
            
            detailDiv.insertAdjacentHTML('beforeend', html)
        
        },

        resetTrackDetail(){
            this.inputField().songDetail.innerHHTML = '';
        },
        resetTracks(){
            this.inputField().songs.innerHTML = '';
            this.resetTrackDetail();
        },
        resetPlaylist(){
            this.inputField().playlists.innerHTML = '';
            this.resetTracks();
        }
    }
})();

const APPController = (function(UICtrl, APICtrl){
    //get input field object ref
    const DOMInputs = UICtrl.inputField();
    
    //get genres on load
    const loadGenres = async () => {
        //get the token
        const token = await APICtrl.getToken();
        //store the token onto the page
        //UICtrl.storeToken(token);
        //get the genres
        const genres = await APICtrl.getGenres(token);
        //populate our genres select element
        genres.forEach(element => UICtrl.createGenre(element.name, element.id));
    }
    //create genre change event listener
    DOMInputs.genre.addEventListener('change', async () =>{

        //when user changes genre, we  need to reset the subsequent fields
        UICtrl.resetPlaylist();
        //get the token, add method to store the token on the page so we don`t nave to keep hitting the api for the token
        const token = UICtrl.getStoredToken().token;
        //get the genre select field
        const genreSelect = UICtrl.imputField().genre;
        // get the sected genreID
        const genreId = genreSelect.options[genreSelect.selectedIndex].value;
        // get the playlist data from spotify based on the genre
        const playlist = await APICtrl.getPlaylistByGenre(token, genreId);
        //load the playpist select field
        playlist.forEach(p => UICtrl.createPlaylist(p.name, p.tracks.href));
    });
    
    //create submit button click event listener
    DOMInputs.submit.addEventListener('click', async (e) =>{
        //prevent page reset
        e.preventDefault();
        UICtrl.resetTracks();
        //get the token
        const token = UICtrl.getStoredToken().token;
        //get the playlist field
        const playlistSelect = UICtrl.imputField().playlist;
        //get the selected playlist
        const tracksEndPoint = playlistSelect.options[playlistSelect.selectedIndex].value;
        //get yhe tracks from the api 
        const tracks = await APICtrl.getTracks(token, tracksEndPoint);
        //populate select list
        tracks.forEach(t => UICtrl.createTrack(t.track.href, t.track.name));
    });
    //create song selection click event listener
    DOMInputs.tracks.addEventListener('click', async (e) => {
        //prevent page reset
        e.preventDefault();
        UICtrl.resetTrackDetail();
        //get the token
        const token = UICtrl.getStoredToken().token;
        //get the track endpoint
        const tracksEndPoint = e.target.id;
        //get the track object
        const track = await APICtrl.getTrack(token, trackEndPoint);
        //load the track details
        UICtrl.resetTrackDetail(track.album.images[2].url, track.name, track.artists[0].name);
    });
    return{
        init(){
            console.log('App is starting');
            loadGenres();
        }
    }
    
})(UIControler, APIControler);
//will need to call a method to load the genres on page load
APPController.init();