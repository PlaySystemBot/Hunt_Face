var image_b = "";
document.addEventListener('DOMContentLoaded', () => {
    var _filename = '';
    var _boundings = [];
    var _boundings_out = [];
    var _b_index = 0;
    var _images_processed = 0;
    var locale = document.documentElement.lang;
    var db = $('#query').val(); // Получаем значение переменной db из скрытого поля
    var localizedStrings = {
        filesAllowed: {
            'en': '<p>The allowed file formats are jpeg, png<br>The file size limit is 25MB</p>',
            'ru': '<p>Разрешённые типы файлов: jpeg, png<br>Максимальный размер: 25MB</p>'
        },
        notFoundError: {
            'en': 'No faces found on uploaded image',
            'ru': 'Лица на фото не обнаружены'
        },
        generalNetworkError: {
            'en': 'General network error',
            'ru': 'Общая ошибка сети'
        },
        identicalFound: {
            'en': 'Identical',
            'ru': 'Совпадения'
        },
        noIdenticalFound: {
            'en': 'No identical found',
            'ru': 'Совпадений не найдено'
        },
        similarFound: {
            'en': 'Similar',
            'ru': 'Похожие'
        },
        noSimilarFound: {
            'en': 'No similar found',
            'ru': 'Совпадений не найдено'
        },
        otherFound: {
            'en': 'Other',
            'ru': 'Остальные'
        },
        noOtherFound: {
            'en': 'Nothing found',
            'ru': 'Остальных не найдено'
        },
        scoreLabel: {
            'en': 'score',
            'ru': 'совпадение'
        },
        countryLabel: {
            'en': 'country',
            'ru': 'страна'
        },
        profileLabel: {
            'en': 'Link to profile',
            'ru': 'Профиль'
        },
        photoLabel: {
            'en': 'Photo',
            'ru': 'Фото'
        },
        pluralYear1: {
            'en': 'years',
            'ru': 'год'
        },
        pluralYear2: {
            'en': 'years',
            'ru': 'года'
        },
        pluralYear3: {
            'en': 'years',
            'ru': 'лет'
        },
        searchProgress: {
            'en': 'Searching',
            'ru': 'Идет поиск'
        },
        noneString: {
            'en': 'none',
            'ru': 'нет'
        },
        birthYear: {
            'en': 'Birth year',
            'ru': 'Год рождения'
        }
    };

    $('select').trigger('change');

    function status(response) {
        if (response.status >= 200 && response.status < 300) {
            return Promise.resolve(response)
        } else {
            return Promise.reject(new Error(response.statusText))
        }
    }

    function json(response) {
        return response.json()
    }

    $('#slider-container').slick({
        infinite: false,
        arrows: true,
        prevArrow: '<button class="nav-button prev-next-button previous" type="button" aria-label="Previous"><svg class="button-icon" viewBox="0 0 100 100"><path d="M 10,50 L 60,100 L 70,90 L 30,50  L 70,10 L 60,0 Z" class="arrow"></path></svg></button>',
        nextArrow: '<button class="nav-button prev-next-button next" type="button" aria-label="Next"><svg class="button-icon" viewBox="0 0 100 100"><path d="M 10,50 L 60,100 L 70,90 L 30,50  L 70,10 L 60,0 Z" class="arrow" transform="translate(100, 100) rotate(180) "></path></svg></button>',
        appendArrows: '.slick-nav',
        dots: true,
        appendDots: '.slick-nav'
    });

    $('#slider-container').on('afterChange', function(event, slick, currentSlide) {
        _b_index = currentSlide;
    });

    function handleCanvas(canvas, k) {
        canvas.toBlob((blob) => {
            var o_reader = new FileReader();
            o_reader.readAsDataURL(blob);
            o_reader.k = k;
            o_reader.onload = event => {
                k = event.target.k;
                $('#slider-container').slick('slickAdd', '<div class="slick-item" index="' + k + '"><img id="face-preview" class="img-thumbnail d-block" style="display: block; margin-left: auto; margin-right: auto;" src="' + event.target.result + '" alt=""></div>');
                _boundings_out[_images_processed] = _boundings[k];
                _images_processed++;
                if (_images_processed >= _boundings.length) {
                    $("#search-button").prop('disabled', false);
                    $('#slider-container').slick('slickGoTo', 0);
                };
            };
        }, 'image/jpeg', 1);
    }

    const upploadPicture = new window.uppload_Uppload({
        value: "https://placehold.it/400x350",
        call: ".uppload-button",
        defaultService: "local",
        lang: window['uppload_' + locale],
        uploader: (file, metadata) => {
            return new Promise((resolve, reject) => {
                const formData = new FormData();
                formData.append('file', file);

                fetch("/upload", {
                    method: "POST",
                    body: formData
                }).then(status).then(json).then(json => {
                    console.log("Server response:", json);  // Добавляем журналирование
                    let url = json.url;
                    if (url) {
                        resolve('Ok');
                        $(".search-results").empty();
                        $(".results-title").empty();
                        $('#slider-container').slick('removeSlide', null, null, true);
                        _boundings = json.boundings;
                        _scale = json.scale;
                        _filename = url;
                        _b_index = 0;
                        _boundings_out = [];
                        _images_processed = 0;
                        image_b = json.image;
                        for (var k = 0; k < _boundings.length; k++) {
                            const face = _boundings[k];

                            // Проверка и конвертация координат лица
                            const x = face.x;
                            const y = face.y;
                            const width = face.width;
                            const height = face.height;

                            if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
                                console.error(`Invalid coordinates for face ${k}:`, face);
                                continue;
                            }

                            const img = new Image();
                            img.src = url;
                            img.k = k;
                            img.onload = event => {
                                k = event.target.k;
                                const elem = document.createElement('canvas');
                                const canvasWidth = 200;

                                const scaledX = x * _scale;
                                const scaledY = y * _scale;
                                const scaledWidth = width * _scale;
                                const scaledHeight = height * _scale;

                                const scaleFactor = canvasWidth / scaledWidth;
                                elem.width = canvasWidth;
                                elem.height = scaledHeight * scaleFactor;
                                const ctx = elem.getContext('2d');
                                ctx.drawImage(img, scaledX, scaledY, scaledWidth, scaledHeight, 0, 0, elem.width, elem.height);
                                handleCanvas(ctx.canvas, k);
                            };
                            img.onerror = error => console.log(error);
                        }
                    } else {
                        reject(new Error(localizedStrings['notFoundError'][locale]));
                    }
                }).catch(error => reject(new Error(localizedStrings['generalNetworkError'][locale])));

            });
        }
    });

    const localService = new window.uppload_Local({
        maxFileSize: 26214400,
        mimeTypes: ["image/png", "image/jpeg"]
    });
    upploadPicture.use([localService]);
    upploadPicture.use([new window.uppload_Preview(), new window.uppload_Rotate(), new window.uppload_Brightness(), new window.uppload_Contrast(), new window.uppload_Crop()]);
    upploadPicture.on("fileSelected", file => {});
    upploadPicture.on("hide-help", () => {
        if (upploadPicture.isOpen) {
            if (upploadPicture.activeService == 'default') upploadPicture.activeService = 'local';
            var prev = document.querySelector('input[name="uppload-effect-radio"][value="preview"]');
            if (prev) prev.checked = true;
        };
    });
    upploadPicture.on("open", () => {
        $(upploadPicture.container).find(".drop-area").append(localizedStrings['filesAllowed'][locale]);
    });

    function replacer(name, val) {
        if ((name === 'results') && (val == '50')) {
            return undefined;
        } else {

            return val;
        }
    };

    function declOfNum(number, titles) {
        cases = [2, 0, 1, 1, 1, 2];
        return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
    };

    function process_faces(db, faces_found, profiles) {
        console.log("Processing faces for db:", db, "faces_found:", faces_found, "profiles:", profiles);
        var count1 = 0;
        var count2 = 0;
        var count3 = 0;
        $.each(profiles, function(index, profile) {
            const faceDb = profile.source || '';
            const profileUrl = profile.profile || '';
            const face = profile.face || '';
            const photo = (profile.photo !== null && profile.photo !== "") ? profile.photo : "";
            const photoId = profile.photo_id || '';
            const source = (profile.source !== null && profile.source !== "") ? profile.source : "";
            const score = profile.score || 0;
            const filtered = profile.filtered || '';
            const age = (Number.isInteger(profile.age) && (profile.age > 0)) ? (profile.age.toString() + " " + declOfNum(profile.age, [localizedStrings['pluralYear1'][locale], localizedStrings['pluralYear2'][locale], localizedStrings['pluralYear3'][locale]])) : "";
            const firstName = (profile.first_name !== null && profile.first_name !== "") ? profile.first_name : "";
            const lastName = (profile.last_name !== null && profile.last_name !== "") ? profile.last_name : "";
            const maidenName = (profile.maiden_name !== null && profile.maiden_name !== "") ? profile.maiden_name : "";
            const city = (profile.city !== null && profile.city !== "") ? (" [" + profile.city + "]") : "";
            const country = profile.country || '';
            const born = (profile.born !== null && profile.born !== "" && profile.born !== 0) ? (" [" + profile.born + "]") : "";
            const bio = (profile.bio !== null && profile.bio !== "") ? profile.bio : localizedStrings['noneString'][locale];

            console.log("Processing profile:", {
                faceDb, profileUrl, face, photo, photoId, source, score, filtered, age, firstName, lastName, maidenName, city, country, born, bio
            });

            switch (db) {
                case "vkok_avatar":
                    var photoCard = `<div class="card card-vk01 border border-primary">\n<div>\n<div class="card-vk01-fixed">\n<a href="${profileUrl}" target="_blank"><img src="${face}" class="card-img-vk01" alt="${firstName.substring(0, 25)} ${lastName.substring(0, 25)}"></a>\n</div>\n<div class="col">\n<div class="card-body card-vk01-body">\n<div class="card-vk01-header">${firstName} ${lastName}</div>\n<div class="card-vk01-score">${localizedStrings['scoreLabel'][locale]}: <span class="score-label">${score}%</span></div>\n<div class="card-vk01-age">${age}${born}</div>\n<div class="card-vk01-geo">${country}${city}</div>\n<div class="btn-vk01-container">\n<a href="${profileUrl}" target="_blank" class="btn-vk01">${localizedStrings['profileLabel'][locale]}</a>\n<a href="#" data-bs-target="#modalIMG" data-bs-toggle="modal" class="btn-vk01" data-imgsrc="${source}" data-imghref="${photo}">${localizedStrings['photoLabel'][locale]}</a>\n</div>\n</div>\n</div>\n</div>\n</div>`;
                    break;
                case "vk_wall":
                    var photoCard = `<div class="card card-vk01 border border-primary">\n<div>\n<div class="card-vk01-fixed">\n<a href="${profileUrl}" target="_blank"><img src="${face}" class="card-img-vk01" alt="${firstName.substring(0, 25)} ${lastName.substring(0, 25)}"></a>\n</div>\n<div class="col">\n<div class="card-body card-vk01-body">\n<div class="card-vk01-header">${firstName} ${lastName}</div>\n<div class="card-vk01-score">${localizedStrings['scoreLabel'][locale]}: <span class="score-label">${score}%</span></div>\n<div class="card-vk01-age">${age}${born}</div>\n<div class="card-vk01-geo">${country}${city}</div>\n<div class="btn-vk01-container">\n<a href="${profileUrl}" target="_blank" class="btn-vk01">${localizedStrings['profileLabel'][locale]}</a>\n<a href="#" data-bs-target="#modalIMG" data-bs-toggle="modal" class="btn-vk01" data-imgsrc="${source}" data-imghref="${photo}">${localizedStrings['photoLabel'][locale]}</a>\n</div>\n</div>\n</div>\n</div>\n</div>`;
                    break;
                case "tt_avatar":
                    var photoCard = `<div class="card card-vk01 border border-primary">\n<div>\n<div class="card-vk01-fixed">\n<a href="${profileUrl}" target="_blank"><img src="${face}" class="card-img-vk01" alt="${firstName.substring(0, 25)} ${lastName.substring(0, 25)}"></a>\n</div>\n<div class="col">\n<div class="card-body card-vk01-body">\n<div class="card-vk01-header">${firstName} ${lastName}</div>\n<div class="card-vk01-score">${localizedStrings['scoreLabel'][locale]}: <span class="score-label">${score}%</span></div>\n<div class="card-vk01-age">${age}${born}</div>\n<div class="card-vk01-geo">${country}${city}</div>\n<div class="btn-vk01-container">\n<a href="${profileUrl}" target="_blank" class="btn-vk01">${localizedStrings['profileLabel'][locale]}</a>\n<a href="#" data-bs-target="#modalIMG" data-bs-toggle="modal" class="btn-vk01" data-imgsrc="${source}" data-imghref="${photo}">${localizedStrings['photoLabel'][locale]}</a>\n</div>\n</div>\n</div>\n</div>\n</div>`;
                    break;
                case "ch_avatar":
                    var photoCard = `<div class="card card-vk01 border border-primary">\n<div>\n<div class="card-vk01-fixed">\n<a href="${profileUrl}" target="_blank"><img src="${face}" class="card-img-vk01" alt="${firstName.substring(0, 25)} ${lastName.substring(0, 25)}"></a>\n</div>\n<div class="col">\n<div class="card-body card-vk01-body">\n<div class="card-vk01-header">${firstName} ${lastName}</div>\n<div class="card-vk01-score">${localizedStrings['scoreLabel'][locale]}: <span class="score-label">${score}%</span></div>\n<div class="card-vk01-age">${age}${born}</div>\n<div class="card-vk01-geo">${country}${city}</div>\n<div class="btn-vk01-container">\n<a href="${profileUrl}" target="_blank" class="btn-vk01">${localizedStrings['profileLabel'][locale]}</a>\n<a href="#" data-bs-target="#modalIMG" data-bs-toggle="modal" class="btn-vk01" data-imgsrc="${source}" data-imghref="${photo}">${localizedStrings['photoLabel'][locale]}</a>\n</div>\n</div>\n</div>\n</div>\n</div>`;
                    break;
                case "vkokn_avatar":
                    var photoCard = `<div class="card card-vk01 border border-primary">\n<div>\n<div class="card-vk01-fixed">\n<a href="${profileUrl}" target="_blank"><img src="${face}" class="card-img-vk01" alt="${firstName.substring(0, 25)} ${lastName.substring(0, 25)}"></a>\n</div>\n<div class="col">\n<div class="card-body card-vk01-body">\n<div class="card-vk01-header">${firstName} ${lastName}</div>\n<div class="card-vk01-score">${localizedStrings['scoreLabel'][locale]}: <span class="score-label">${score}%</span></div>\n<div class="card-vk01-age">${age}${born}</div>\n<div class="card-vk01-geo">${country}${city}</div>\n<div class="btn-vk01-container">\n<a href="${profileUrl}" target="_blank" class="btn-vk01">${localizedStrings['profileLabel'][locale]}</a>\n<a href="#" data-bs-target="#modalIMG" data-bs-toggle="modal" class="btn-vk01" data-imgsrc="${source}" data-imghref="${photo}">${localizedStrings['photoLabel'][locale]}</a>\n</div>\n</div>\n</div>\n</div>\n</div>`;
                    break;
                case "sb_photo":
                    var photoCard = `<div class="card card-vk01 border border-primary">\n<div>\n<div class="card-vk01-fixed">\n<a href="${profileUrl}" target="_blank"><img src="${face}" class="card-img-vk01" alt="${firstName.substring(0, 75)}"></a>\n</div>\n<div class="col">\n<div class="card-body card-vk01-body">\n<div class="card-vk01-header">${firstName.substring(0, 75)}${born}</div>\n<div class="card-vk01-score">${localizedStrings['scoreLabel'][locale]}: <span class="score-label">${score}%</span></div>\n<div class="card-vk01-bio mt-1"><span style="font-weight: 600">${bio.substring(0, 255)}</span></div>\n<div class="btn-vk01-container">\n<a href="#" data-bs-target="#modalIMG" data-bs-toggle="modal" class="btn-vk01" data-imgsrc="${source}" data-imghref="${photo}">${localizedStrings['photoLabel'][locale]}</a>\n<a href="${profileUrl}" target="_blank" class="btn-vk01">${localizedStrings['profileLabel'][locale]}</a>\n</div>\n</div>\n</div>\n</div>\n</div>`;
                    break;
                default:
                    var photoCard = `<div class="card card-vk01 border border-primary">\n<div>\n<div class="card-vk01-fixed">\n<a href="${profileUrl}" target="_blank"><img src="${face}" class="card-img-vk01" alt="${firstName.substring(0, 25)} ${lastName.substring(0, 25)} ${maidenName.substring(0, 25)}"></a>\n</div>\n<div class="col">\n<div class="card-body card-vk01-body">\n<div class="card-vk01-header">${firstName.substring(0, 25)} ${lastName.substring(0, 25)} ${maidenName.substring(0, 25)}</div>\n<div class="card-vk01-score">${localizedStrings['scoreLabel'][locale]}: <span class="score-label">${score}%</span></div>\n<div class="card-vk01-age">${age}${born}</div>\n<div class="card-vk01-geo">${country}${city}</div>\n<div class="btn-vk01-container">\n<a href="${profileUrl}" target="_blank" class="btn-vk01">${localizedStrings['profileLabel'][locale]}</a>\n<a href="#" data-bs-target="#modalIMG" data-bs-toggle="modal" class="btn-vk01" data-imgsrc="${source}" data-imghref="${photo}">${localizedStrings['photoLabel'][locale]}</a>\n</div>\n</div>\n</div>\n</div>\n</div>`;
                    break;
            };

            if (score >= 57) {
                $("#search-results1").append(photoCard);
                count1++;
            } else if (score >= 54) {
                $("#search-results2").append(photoCard);
                count2++;
            } else {
                $("#search-results3").append(photoCard);
                count3++;
            };
        });

        if (count1 > 0) {
            $("#results-title1").html(localizedStrings['identicalFound'][locale]);
        } else {
            $("#results-title1").html(localizedStrings['noIdenticalFound'][locale]);
        };
        if (count2 > 0) {
            $("#results-title2").html(localizedStrings['similarFound'][locale]);
        } else if (count1 == 0) {
            $("#results-title2").html(localizedStrings['noSimilarFound'][locale]);
        };
        if (count3 > 0) {
            $("#results-title3").html(localizedStrings['otherFound'][locale]);
        } else if ((count1 == 0) && (count2 == 0)) {
            $("#results-title3").html(localizedStrings['noOtherFound'][locale]);
        };
    };

    $('#modalIMG').on('show.bs.modal', function(e) {
        var src = e.relatedTarget.dataset.imgsrc;
        var href = e.relatedTarget.dataset.imghref;
        $("#modalIMGsrc").attr("src", src);
        $("#modalIMGhref").attr("href", href);
    });

    $('#search-button').on('click', function(e) {
        var $this = $(this);
        var loadingText = "<i class='fa fa-spinner fa-spin'></i> " + localizedStrings['searchProgress'][locale];
        if ($(this).html() !== loadingText) {
            $this.data('original-text', $(this).html());
            $this.html(loadingText);
            $("#search-fields").prop('disabled', true);
            $(".search-results").empty();
            $(".results-title").empty();

            var source = $('#source').val() || 'vk_wall';

            var face = _boundings_out[_b_index];
            var cleanedFace = {
                x: face.x,
                y: face.y,
                width: face.width,
                height: face.height,
                lm1_x: face.lm1_x,
                lm1_y: face.lm1_y,
                lm2_x: face.lm2_x,
                lm2_y: face.lm2_y,
                lm3_x: face.lm3_x,
                lm3_y: face.lm3_y,
                lm4_x: face.lm4_x,
                lm4_y: face.lm4_y,
                lm5_x: face.lm5_x,
                lm5_y: face.lm5_y
            };

            var resultsValue = parseInt($('#results').val(), 10);
            console.log("Selected results value:", resultsValue);

            var requestBody = {
                query: $('#query').val(),
                source: source,
                results: resultsValue,
                lang: locale,
                image: image_b,
                face: cleanedFace,
                db: db // передаем переменную db в запрос
            };

            console.log("Sending request to /detect endpoint with body:", requestBody);

            fetch('/detect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }).then(response => {
                console.log("Received response from /detect endpoint", response);
                return response.json();
            }).then(json => {
                console.log("Processing response JSON", json);
                if (json.error) {
                    console.error("Error in response:", json.error);
                } else {
                    process_faces(db, json.faces_found, json.profiles); // передаем db в функцию
                }
                $this.html($this.data('original-text'));
                $("#search-fields").prop('disabled', false);
                $('html, body').animate({
                    scrollTop: $("#results-title1").offset().top - 100
                }, 1000);
            }).catch(err => {
                console.error("Error during fetch operation", err);
                $this.html($this.data('original-text'));
                $("#search-fields").prop('disabled', false);
            });
        }
    });

});
