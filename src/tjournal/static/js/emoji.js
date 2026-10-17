function populateInputWithEmoji(input, emoji) {
	input.val(input.val() + emoji);
}

$(document).on('click', '.emojiPopulateBtn', (e) => {
    let inpId = '#'+$(e.target).attr('data-inputId');
    let emoji = $(e.target).attr('data-emoji');
    populateInputWithEmoji($(inpId), emoji);
    $(inpId)[0].focus();
});

let emojiObj = null;
$(document).on('click', '.emojiTrigger', (e) => {
    // load only the first time
    if (emojiObj == null) {
        $.ajax({
            method: 'GET',
            url: '/static/json/emoji.json',
            success: (data) => {
                emojiObj = data;
                for (i of emojiObj) {
                    let prevEl = '';
                    if (emojiObj.indexOf(i) > 0) {
                        prevEl = emojiObj[emojiObj.indexOf(i) - 1].category;
                    }

                    if (i.category != prevEl) {
                        $('#emojiDropFluid').append(`
                            <div data-emojiCategory="${i.category}" class="emojiContainer mt-4">
                                <span class="text-dark fw-bold emojiCatHeads d-none d-block mb-2" style="font-size: 1.1rem;">${i.category}</span>
                                <div class="emojiFluid"></div>
                            </div>
                        `);
                    }
                    $(`.emojiContainer[data-emojiCategory='${i.category}']`).find('div.emojiFluid').append(`
                        <button data-category="${i.category}" data-aliases="${i.aliases}" data-tags="${i.tags}" data-inputId="chat_input" data-emoji="${i.emoji}" class="emojiPopulateBtn n-border-outline d-inline-block btn-bx-s">${i.emoji}</button>
                    `);
                }
                $('.emojiCatHeads').removeClass('d-none');
                $('.emojiLoadingP').remove();
            },
            error: () => {
                showAlert('There was a problem loading emojis');
                $('.emojiLoadingP').remove();
            },
            beforeSend: () => {
                $('#emojiDropFluid').append(`
                    <p class="text-center text-secondary emojiLoadingP">
                        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    </p>
                `);
            }
        });
    }
});

// emoji search
$(document).on('input', '#emojiSearch', debounce(function (e) {
    let query = e.target.value.toLowerCase();
    let elems = $('.emojiPopulateBtn');
    let categs = {};
    for (let i of elems) {
        if (!i.dataset['aliases'].toString().toLowerCase().includes(query) && !i.dataset['tags'].toString().toLowerCase().includes(query)) {
            i.classList.add('d-none');
        } else {
            i.classList.remove('d-none');
            categs[i.dataset['category']] = (categs[i.dataset['category']] !== undefined) ? true : true;
        }
    }
    for (let i of elems) {
        for (let j in categs) {
            if (categs[i.dataset['category']] == undefined) {
                i.parentElement.parentElement.classList.add('d-none');
            } else {
                i.parentElement.parentElement.classList.remove('d-none');
            }
        }
    }
}, 250));
