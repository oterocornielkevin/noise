$(document).ready(function () {
  // Initializes bootstrap tooltips.
  $('[data-toggle="tooltip"]').tooltip({ delay: { show: 400, hide: 100 } });

  // Declare the sound grid object;
  const soundList = new Map();
  $('.sound-icon').each(function (index, element) {
    soundList.set($(this).data('sound'), new Howl({
      src: ['./sounds/' + $(this).data('sound') + '.mp3'],
      loop: true
    }));
  });

  const media = window.matchMedia('(min-width: 992px)');

  // Initializes the timer display variables
  const outline = document.querySelector('#moving-outline');
  const outlineLength = outline.getTotalLength();
  outline.style.strokeDasharray = outlineLength;
  outline.style.strokeDashoffset = outlineLength;

  // Timer variables
  let timerInterval;
  let timerSet = false;
  let timerDuration = 0;
  let totalDuration = 0;

  let playing = false;
  let previousPlaylist = [];

  // Play / Pause function
  function playPauseSound (sound) {
    $('#' + sound + '-volume').toggleClass('invisible');
    $('#' + sound + '-icon').toggleClass('playing');

    const audio = soundList.get(sound);

    if (audio.playing()) {
      audio.pause();
    } else {
      audio.volume(($('#global-volume').val() * 0.01) * $('#' + sound + '-volume').val() * 0.01);
      audio.play();
    }
  }

  // Update timer function
  function updateTimer () {
    timerDuration = timerDuration - 1000;
    const hours = Math.floor((timerDuration / 3600000));
    const minutes = Math.floor((timerDuration / 60000) % 60);
    const seconds = Math.floor(((timerDuration / 1000) % 60));

    const progress = outlineLength - (timerDuration / totalDuration) * outlineLength;
    outline.style.strokeDashoffset = progress;
    if (timerDuration <= 0) {
      playing = false;
      $('#play-pause img').attr('src', './svg/play.svg');

      soundList.forEach(sound => {
        if (sound.playing()) {
          sound.pause();
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

  // Sound grid pause and play
  $('.sound-icon').click(function () {
    const sound = $(this).data('sound');
    playPauseSound(sound);

    if (!playing) { // Starts a new playlist.
      playing = true;
      $('#play-pause img').attr('src', './svg/pause.svg');

      if (timerSet) {
        timerInterval = setInterval(updateTimer, 1000);
      }
    } else { // A playlist is in progress.
      playing = false;

      soundList.forEach(obj => {
        if (obj.playing()) {
          playing = true;
        }
      });

      if (!playing) {
        $('#play-pause img').attr('src', './svg/play.svg');

        previousPlaylist = [];
        previousPlaylist.push(sound);

        if (timerInterval !== undefined) { // Pause any timers
          clearInterval(timerInterval);
        }
      }
    }
  });

  // Pause and play controls
  $('#play-pause').click(function () {
    if (playing) {
      $('#play-pause img').attr('src', './svg/play.svg');
      playing = false;
      previousPlaylist = [];

      soundList.forEach((sound, name) => {
        if (sound.playing()) {
          playPauseSound(name);
          previousPlaylist.push(name);
        }
      });
      if (timerInterval !== undefined) { // Pause any timers
        clearInterval(timerInterval);
      }
    } else {
      $('#play-pause img').attr('src', './svg/pause.svg');
      playing = true;

      if (previousPlaylist.length === 0) {
        const soundIndex = Math.floor(Math.random() * soundList.length);
        let i = 0;
        soundList.forEach((sound, name) => {
          if (i === soundIndex) {
            playPauseSound(name);
          }
          i++;
        });
      } else {
        previousPlaylist.forEach(sound => {
          playPauseSound(sound);
        });
      }
      if (timerSet) {
        timerInterval = setInterval(updateTimer, 1000);
      }
    }
  });

  // Individual volume controls
  $('input[type=range].sound-volume').on('input', function () {
    const sound = soundList.get($(this).attr('id').substr(0, $(this).attr('id').indexOf('-')));
    $(this).attr('data-original-title', $(this).val()).tooltip('show');
    sound.volume(($('#global-volume').val() * 0.01) * $('#' + $(this).attr('id').substr(0, $(this).attr('id').indexOf('-')) + '-volume').val() * 0.01);
  });

  // Global volume display
  $('#global-volume-icon').click(function () {
    $(this).toggleClass('playing');
    $('#global-volume').toggleClass('invisible');
  });

  // Global volume Controls
  $('#global-volume').on('input', function () {
    const globalVolume = $(this).val() * 0.01;
    soundList.forEach((sound, name) => {
      sound.volume(globalVolume * $('#' + name + '-volume').val() * 0.01);
    });

    $(this).attr('data-original-title', $(this).val()).tooltip('show');

    if (globalVolume === 0) {
      $('#global-volume-icon img').attr('src', './svg/mute.svg');
    } else if (globalVolume > 0) {
      $('#global-volume-icon img').attr('src', './svg/speaker.svg');
    }
  });

  // Playlist controls
  $('.playlist').click(function () {
    const playlist = $(this).data('playlist').split(',');
    const volumes = $(this).data('playlist-volume').split(',');
    let index = 0;
    playlist.forEach(sound => {
      $('#' + sound + '-volume').val(volumes[index]);
      index++;
    });

    soundList.forEach((sound, name) => {
      if (playlist.includes(name)) {
        if (!sound.playing()) {
          $('#' + name + '-volume').toggleClass('invisible');
          $('#' + name + '-icon').toggleClass('playing');
        }
        sound.volume(($('#global-volume').val() * 0.01) * $('#' + name + '-volume').val() * 0.01);
        sound.play();
      } else {
        if (sound.playing()) {
          $('#' + name + '-volume').toggleClass('invisible');
          $('#' + name + '-icon').toggleClass('playing');
        }
        sound.pause();
      }
    });

    if (!playing) {
      playing = true;
      $('#play-pause img').attr('src', './svg/pause.svg');
    }

    if (timerSet) {
      timerInterval = setInterval(updateTimer, 1000);
    }
  });

  // Timer Controls
  $('#timer-start-button').click(function () {
    timerDuration = (($('#timer-seconds').val()) * 1000) + (($('#timer-minutes').val()) * 60000) + (($('#timer-hours').val()) * 3600000);
    totalDuration = timerDuration;

    if (timerDuration > 0) {
      if (playing) {
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

      // Removes validation feedback if present
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

      if (timerInterval !== undefined) {
        clearInterval(timerInterval);
      }
    }
  });
  // Timer reset controls
  $('#timer-reset-button').click(function () {
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

  // Focus event for desktop version.
  if (media.matches) {
    $('input[type=number].timer-input').on('input', function () {
      if ($(this).val() < 10) {
        $(this).val('0' + parseInt($(this).val()));
      }
      if ($(this).val() > 0) {
        $('#timer-hours').removeClass('invalid-timer');
        $('#timer-minutes').removeClass('invalid-timer');
        $('#timer-seconds').removeClass('invalid-timer');
        $('#invalid-timer-feedback').addClass('invisible');
      }
    });
  } else if (!media.matches) { // Focus event for mobile version.
    $('input[type=number].timer-input').focus(function () {
      if ($(this).val() === '00') {
        $(this).val('');
      }
    });
    $('input[type=number].timer-input').focusout(function () {
      if ($(this).val() === '') {
        $(this).val('00');
      } else if ($(this).val() > 0 && $(this).val() < 10) {
        $(this).val('0' + parseInt($(this).val()));
      } else {
        if ($(this).val() > 24 && $(this).attr('id') === 'timer-hours') {
          $(this).val('24');
        } else if ($(this).val() > 59) {
          $(this).val('59');
        }
      }
    });
  }

  // Modal Toggles
  $('#about-icon').click(function () {
    $('#about-modal').modal();
  });

  $('#timer-icon').click(function () {
    $('#timer-modal').modal();
    if (media.matches) { // Disables keypresses on the timer inputs on desktop mode.
      $('.timer-input').keypress(function (e) {
        e.preventDefault();
      });
    }
  });

  $('#playlists-button').click(function () {
    $('#playlist-modal').modal();
  });
});
