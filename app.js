$(document).ready(function(){

    //Initializes tooltips.
    $('[data-toggle="tooltip"]').tooltip({'delay': { show: 400, hide: 100 }});

    const soundList = ['rain', 'thunder', 'wind', 'fire', 'forest', 'fan', 'water', 'night', 'whitenoise', 'car', 'train', 'coffeeshop'];

    const outline = document.querySelector('#moving-outline');
    const outlineLength = outline.getTotalLength();
    outline.style.strokeDasharray = outlineLength;
    outline.style.strokeDashoffset = outlineLength;

    let timerDuration = 0;
    let totalDuration = 0;
    let timerSet = false;
    let playing = false;
    let currentPlaylist = [];

    let timerInterval;

    function playPauseSound(audio) {
        $('#' + audio.id.substr(0, audio.id.indexOf('-')) + '-volume').toggleClass('invisible');
        $('#' + audio.id.substr(0, audio.id.indexOf('-')) + '-icon').toggleClass('playing');

        if(audio.paused) {
            audio.volume = ($('#global-volume').val() * 0.01) * $('#' + audio.id.substr(0, audio.id.indexOf('-')) + '-volume').val() * 0.01;
            audio.play();
        } else {
            audio.pause();
        }
    }

    function updateTimer() {
        timerDuration = timerDuration - 1000;
        const hours = Math.floor((timerDuration / 3600000));
        const minutes = Math.floor((timerDuration / 60000) % 60);
        const seconds = Math.floor(((timerDuration / 1000) % 60));

        let progress = outlineLength - (timerDuration / totalDuration) * outlineLength;
        outline.style.strokeDashoffset = progress;
        
        if(timerDuration <= 0) {
            playing = false;
            $('#play-pause').toggleClass('fa-pause'); 
            $('#play-pause').toggleClass('fa-play');

            const audios = document.querySelectorAll('audio');
            audios.forEach(audio => {
                if(!audio.paused){
                    playPauseSound(audio);
                }
            });
            $('#timer-seconds').val('00');
            $('#timer-start-button').removeAttr('disabled');
            $('#timer-hours').removeAttr('disabled');
            $('#timer-minutes').removeAttr('disabled');
            $('#timer-seconds').removeAttr('disabled');
            $('#timer-reset-button').attr('disabled', '');
            $('#moving-outline').addClass('invisible');
            outline.style.strokeDasharray = outlineLength;
            outline.style.strokeDashoffset = outlineLength;
            timerSet = false;
            clearInterval(timerInterval);
        } else {
            $('#timer-seconds').val(seconds < 10 ? '0' + seconds : seconds);
            $('#timer-minutes').val((minutes < 10 ? '0' + minutes : minutes));
            $('#timer-hours').val((hours < 10 ? '0' + hours : hours));
        }
    }

    //Sound icon event listener
    $('.sound-icon').click(function() {
        const sound = $(this).attr('data-sound');
        const audio = document.querySelector('#' + sound + '-audio');
        
        playPauseSound(audio);

        if(!playing) { //Starts a new playlist.
            playing = true;
            $('#play-pause').toggleClass('fa-pause');
            $('#play-pause').toggleClass('fa-play'); 

            currentPlaylist = [];
            currentPlaylist.push(sound);

            if(timerSet) {
                timerInterval = setInterval(updateTimer, 1000);
            }
        } else { //Playlist is in progress
            if(audio.paused) { 
                currentPlaylist.splice(currentPlaylist.indexOf(sound), 1);
            } else { 
                currentPlaylist.push(sound);
            }
            if(currentPlaylist.length === 0) {
                playing = false;
                $('#play-pause').toggleClass('fa-pause');
                $('#play-pause').toggleClass('fa-play');

                if(timerInterval != undefined) { //Pause any timers
                    clearInterval(timerInterval);
                }
            } 
        }
    });

    //Individual volume controls
    $('input[type=range].sound-volume').on('input', function(){
        const audio = document.getElementById((this.getAttribute('id').substr(0, this.getAttribute('id').indexOf('-')))  + '-audio');
        audio.volume = ($('#global-volume').val() * 0.01) * $(this).val() * 0.01;
    });

    //Global volume display
    $('.fa-volume-up').click(function() {
        $(this).toggleClass('playing');
        $('#global-volume').toggleClass('invisible');
    });

    //Global volume controls
    $('#global-volume').on('input', function(){
        const globalVolume = $('#global-volume').val() * 0.01;
        const sounds = document.querySelectorAll('audio');
        sounds.forEach(sound => {
            sound.volume = (($('#' + sound.id.substr(0, sound.id.indexOf('-')) + '-volume').val()) * 0.01) * globalVolume;
        });

        if(globalVolume === 0){
            $('#global-volume-icon').removeClass('fa-volume-up');
            $('#global-volume-icon').addClass('fa-volume-mute');
        } else if (globalVolume > 0) {
            $('#global-volume-icon').addClass('fa-volume-up');
            $('#global-volume-icon').removeClass('fa-volume-mute');
        }
    });

    //Global Pause and Play
    $('.fa-play').click(function() {
        $('#play-pause').toggleClass('fa-pause'); 
        $('#play-pause').toggleClass('fa-play');
        
        if(playing){ //Pause
            playing = false;

            const audios = document.querySelectorAll('audio');
            audios.forEach(audio => {
                if(!audio.paused){
                    playPauseSound(audio);
                }
            });

            if(timerInterval != undefined){ //Pause any timers
                clearInterval(timerInterval);
            }
        } else{ //Play
            playing = true;

            //If the playlist is empty, it plays a random sound.
            if(currentPlaylist.length === 0){
                const soundCount = soundList.length;
                const soundIndex = Math.floor(Math.random() * soundCount);

                const audio = document.querySelector('#' + soundList[soundIndex] + '-audio');
                playPauseSound(audio);

                currentPlaylist.push(soundList[soundIndex]);
            } else { //Resume existing playlist.

                currentPlaylist.forEach(sound => {
                    const audio = document.querySelector('#' + sound + '-audio');
                    playPauseSound(audio);
                });
            }

            if(timerSet){
                timerInterval = setInterval(updateTimer, 1000);
            }
        }
    });

    //Playlist controls
    $('.playlist').click(function() {
        const playlist = $(this).attr('data-playlist').split(',');
        const volumes = $(this).attr('data-playlist-volume').split(',');

        //Pause any currently playing sounds
        if(playing){
            currentPlaylist.forEach(sound => {
                const audio = document.querySelector('#' + sound + '-audio');
                playPauseSound(audio)
            });
        } else {
            playing = true;
            $('#play-pause').toggleClass('fa-pause'); 
            $('#play-pause').toggleClass('fa-play');
        }

        currentPlaylist = [];

        //Play each sound in the playlist
        playlist.forEach(sound => {
            const audio = document.querySelector('#' + sound + '-audio');
            playPauseSound(audio)

            currentPlaylist.push(sound);

            audio.volume = (volumes[playlist.indexOf(sound)] * 0.01) * ($('#global-volume').val() * 0.01);
            $('#' +  sound + '-volume').attr('value', volumes[playlist.indexOf(sound)]);
        });

        if(timerSet) {
            timerInterval = setInterval(updateTimer, 1000);
        }
    });

    //Timer controls
    $('#timer-start-button').click(function() {
        timerDuration = (($('#timer-seconds').val()) * 1000) + (($('#timer-minutes').val()) * 60000) + (($('#timer-hours').val()) * 3600000);
        totalDuration = timerDuration;

        if(timerDuration > 0){
            if(playing) {
                timerInterval = setInterval(updateTimer, 1000);
            } else {
                timerSet = true;
            }
            
            $('#timer-reset-button').removeAttr('disabled');
            $('#timer-hours').attr('disabled', '');
            $('#timer-minutes').attr('disabled', '');
            $('#timer-seconds').attr('disabled', '');
            $(this).attr('disabled', '');

            $('#moving-outline').removeClass('invisible');

            //Removes validation feedback if present
            $('#timer-hours').removeClass('invalid-timer');
            $('#timer-minutes').removeClass('invalid-timer');
            $('#timer-seconds').removeClass('invalid-timer');
            $('#invalid-timer-feedback').addClass('invisible');

            $('#timer-modal').modal('hide');
        } else {
            $('#timer-hours').addClass('invalid-timer');
            $('#timer-minutes').addClass('invalid-timer');
            $('#timer-seconds').addClass('invalid-timer');
            $('#invalid-timer-feedback').removeClass('invisible');

            if(timerInterval !== undefined){
                clearInterval(timerInterval);
            }
            
        }
    });

    //Timer reset controls
    $('#timer-reset-button').click(function() {
        clearInterval(timerInterval);
        timerSet = false;
        $('#timer-seconds').val('00');
        $('#timer-minutes').val('00');
        $('#timer-hours').val('00');
        $('#timer-hours').removeAttr('disabled');
        $('#timer-minutes').removeAttr('disabled');
        $('#timer-seconds').removeAttr('disabled');
        $('#timer-start-button').removeAttr('disabled');
        $(this).attr('disabled', '');

        $('#moving-outline').addClass('invisible');
        outline.style.strokeDasharray = outlineLength;
        outline.style.strokeDashoffset = outlineLength;
    });

    $('input[type=number].timer-input').on('input', function(){
        if($(this).val() < 10){
            $(this).val('0' + parseInt($(this).val()));
        }
        if($(this).val() > 0){
            $('#timer-hours').removeClass('invalid-timer');
            $('#timer-minutes').removeClass('invalid-timer');
            $('#timer-seconds').removeClass('invalid-timer');
            $('#invalid-timer-feedback').addClass('invisible');
        }
    });

    //Modal Toggles
    $('#about-icon').click(function() {
        $('#about-modal').modal();
    });

    $('#timer-icon').click(function() {
        $('#timer-modal').modal();
        //Disables keypresses on the timer inputs
        $('.timer-input').keypress(function (e) {
            e.preventDefault();
        });
    });

    $('#playlists-button').click(function() {
        $('#playlist-modal').modal();
    })

});