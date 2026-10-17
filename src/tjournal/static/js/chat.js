let alreadyLoading = false;
let moreMessage = true;
let unreadNewMessage = 0;
function renderChat(data, scrollDown = false, offset = 1) {
    let our_pk_inp = $('#our_pk');
    data.time = data.time.toString().split(':');
    data.time = `${data.time[0]}:${data.time[1]}`;
    let alignChat = 'left';
    let leftImg = `<img width="40" height="40" style="border-radius: 100%;" src="${data.avatar}">`;
    let rightTime = `<small class="d-block my-auto" style="font-size: 0.7rem;">${data.time}</small>`;
    let rightImg = '';
    let leftTime = '';
    if (data.pk == our_pk_inp.val()) {
        if (data.read == false || data.read == undefined) {
            rightTime += `<i style="color: #34b7f1;" class="fa fa-check readStatus-unread" aria-hidden="true"></i>`;
        } else if (data.read == true) {
            rightTime += `<i style="color: #34b7f1;" class="fas fa-check-double readStatus-read" aria-hidden="true"></i>`;
        }
    }
    if (data.pk == our_pk_inp.val()) {
        data.username = 'You';
        alignChat = 'right';
        rightImg = leftImg;
        leftImg = '';
        leftTime = rightTime;
        rightTime = '';
    }
    let atBottom = false;
    if ((Math.floor($('.message_box')[0].scrollHeight)) - Math.floor($('.message_box').scrollTop() + $('.message_box').innerHeight()) <= 30) {
        atBottom = true;
    }
    let tempId = `${data.date}`;
    let unreadScroll = false;
    if (data.read == false && data.pk != our_pk_inp.val()) {
        unreadNewMessage += 1;
        unreadScroll = true;
        if ($('#unreadMessageAlert')[0] == undefined) {
            $(`#${tempId}`).append(
                `<div class="px-3" id="unreadMessageAlert">
                    <div class="badge rounded-pill bg-light d-block d-flex" style="clear: both;align-items: center;justify-content: center;">
                        <span class="py-1 text-dark" style="font-size: 1rem;" id="unreadMesCount">${unreadNewMessage} unread messages</span>
                    </div>
                </div>`
            );
            let unreadMesInterval = setInterval(() => {
                $('#unreadMessageAlert').remove();
                unreadNewMessage = 0;
                clearInterval(unreadMesInterval);
            }, 10000);
        }
        $('#unreadMesCount').html(`${unreadNewMessage} unread messages`);
    }
    let dateMarkUp = `
        <div class="text-center" style="position: sticky;top:0;">
            <span class="badge rounded-pill bg-light text-dark border">${data.date}</span>
        </div>
        <div id="${tempId}"></div>
        `;
    if (document.getElementById(`${data.date}`) == undefined && offset == 1) {
        $('.message_box').append(dateMarkUp);
    } else if (document.getElementById(`${data.date}`) == undefined && offset != 1) {
        $('.message_box').prepend(dateMarkUp);
    }
    let eMessageString =
        `
        <div data-pk="${data.id}" class="py-3 px-2 d-block w-100 n-border-outline eMessage" style="display: flex;flex-direction: column;justify-content: ${alignChat};text-align: ${alignChat};cursor: pointer;">
            <div class="d-inline-flex">
                ${leftImg}
                ${leftTime}
                <div class="mx-2">
                    <small class="d-block">${data.username}</small>
                    <span class="d-block">${data.message}</span>
                </div>
                ${rightImg}
                ${rightTime}
            </div>
        </div>`;
    if (data.deleted_for != our_pk_inp.val()) {
        if (offset == 1) {
            $(`#${tempId}`).append(eMessageString);
        } else {
            $(`#${tempId}`).prepend(eMessageString);
        }
    }
    if ((scrollDown || data.pk == our_pk_inp.val()) && offset == 1) {
        // if the author of the message is this user
        $('.message_box').scrollTop($('.message_box')[0].scrollHeight);
    } else if (!scrollDown && data.pk != our_pk_inp.val() && offset == 1) {
        // if the author of the message is not this user
        if (atBottom) {
            // if user is at the bottom
            $('.message_box').scrollTop($('.message_box')[0].scrollHeight);
        } else {
            // user is not scrolled at the bottom
        }
    }
    if (unreadScroll) {
        $('#unreadMessageAlert').find('div')[0].scrollIntoView();
    }
}

function clearChat() {
    $('.message_box').html('');
}

function markAsRead(chatSocket = null) {
    if (chatSocket != null) {
        chatSocket.send(JSON.stringify({
            chat_pk: currChat,
            to_pk: to_pk,
            type: 'mark_as_read',
        }));
    }
}

let timerInterval;
let retryInterval;
function startReconnectCountdown(retryPeriod) {
    let retryCountdownElem = $('#retryCountdown');
    let timer = retryPeriod / 1000;
    let min;
    let second;
    timerInterval = setInterval(() => {
        timer -= 1;
        if (timer < retryPeriod) {
            $('#chatConnectAlert').removeClass('d-none');
        }

        min = Math.floor(timer / 60);
        second = timer % 60;
        if (second < 10) {
            second = '0' + second;
        }
        retryCountdownElem.html(`Retrying in ${min}:${second}`);
    }, 1000);
}

function loadMessage(chatSocket = null, offset = 1) {
    if (alreadyLoading || !moreMessage) {
        return;
    }
    $.ajax({
        method: 'POST',
        url: `/chat/${currChat}/get/`,
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            offset: offset,
        },
        success: (data) => {
            if (data.messages.length == 0) {
                moreMessage = false;
            }
            for (i in data.messages) {
                data.messages[i]['pk'] = data.messages[i]['author'];
                delete data.messages[i]['author'];
                renderChat(data.messages[i], scrollDown = true, offset);
            }
            offset = Number(data.offset);
            markAsRead(chatSocket = chatSocket);
            $('.messageLoadingP').remove();
            alreadyLoading = false;
        },
        error: () => {
            $('.messageLoadingP').remove();
            alreadyLoading = false;
        },
        beforeSend: () => {
            $('.message_box').prepend(`
            <div class="text-secondary text-center w-100 messageLoadingP mt-4" style="position:absolute;">
                <span class="btn-bx-s px-1 py-1 rounded-circle bg-white" style="width: 40px;height:40px;display:inline-flex;align-items:center;justify-content:center;">
                    <span class="spinner-border px-1 py-1 spinner-border-sm" role="status" aria-hidden="true"></span>
                </span>
            </div>
            `);
            alreadyLoading = true;
        },
    });
}

let retryPeriod = 0;
let arithmeticProgression = 0;
let maximunRetyPeriod = 600000;
let message_pks = [];
let chatSocket;
function initChat(first=true) {
    chatSocket = new WebSocket(
        'ws://'
        + window.location.host
        + '/ws/chat/'
        + currChat
        + '/'
    );

    $('#chatConnectAlert').addClass('d-none');

    if (first) {
        loadMessage();
    }

    chatSocket.onopen = function (e) {
        retryPeriod = 0;
    }

    chatSocket.onmessage = function (e) {
        if (JSON.parse(e.data).chat_message == true) {
            renderChat(JSON.parse(e.data));
            markAsRead(chatSocket);
        } else if (JSON.parse(e.data).mark_as_read == true) {
            if (JSON.parse(e.data).to_pk == $('#our_pk').val()) {
                $('.readStatus-unread').removeClass('readStatus-unread').addClass('readStatus-unread').removeClass('fa-check').addClass('fa-check-double');
            }
        } else if (JSON.parse(e.data).delete_message == true) {
            for (i of $('.eMessage')) {
                for (let j of JSON.parse(e.data).message_pks) {
                    if (i.dataset['pk'] == j && JSON.parse(e.data).pk == $('#our_pk').val()) {
                        $(i).remove();
                    }
                }
            }
            $('.messageOptions').addClass('d-none');
            $('.chat_fluid__send_box').removeClass('d-none');
        }
    }

    chatSocket.onclose = function (e) {
        console.log('Chat socket closed unexpectedly');
        retryPeriod += 3000 + arithmeticProgression;
        arithmeticProgression += arithmeticProgression + 3000;
        if (retryPeriod >= maximunRetyPeriod) {
            retryPeriod = maximunRetyPeriod;
        }
        startReconnectCountdown(retryPeriod);
        retryInterval = setInterval(() => {
            clearInterval(timerInterval);
            clearInterval(retryInterval);
            initChat(first=false);
        }, retryPeriod);
    }
}

$(document).on('submit', '#chat_form', (e) => {
    e.preventDefault();
    let input = $('#chat_input');
    let message = input.val();
    if (message.trim() == '') {
        return;
    }
    chatSocket.send(JSON.stringify({
        message: message,
        pk: $('#our_pk').val(),
        type: 'chat_message',
    }));
    input.val('');
});

document.querySelector('.message_box').addEventListener('scroll', () => {
    let st = document.querySelector('.message_box').scrollTop;
    let sh = document.querySelector('.message_box').scrollHeight;
    if (((st / sh) * 100) < 40) {
        loadMessage(chatSocket = chatSocket, offset = $('.eMessage').length + 1);
    }
});

$(document).on('click', '.eMessage', (e) => {
    let target = e.target;
    while (!target.classList.toString().includes('eMessage')) {
        target = target.parentElement;
    }
    if (!target.classList.toString().includes('delete-message-selected')) {
        target.classList.add('bg-dark');
        target.classList.add('text-white');
        target.classList.add('delete-message-selected');
    } else {
        target.classList.remove('bg-dark');
        target.classList.remove('text-white');
        target.classList.remove('delete-message-selected');
    }
    let elems = $('.eMessage');
    let l = elems.length;
    let l2 = 0;
    message_pks = [];
    for (let i of elems) {
        if (!i.classList.toString().includes('delete-message-selected')) {
            l2 += 1;
        } else {
            message_pks.push(Number(i.dataset['pk']));
        }
    }
    let l3 = l - l2;
    if (l2 == l) {
        $('.messageOptions').addClass('d-none');
        $('.chat_fluid__send_box').removeClass('d-none');
    } else {
        $('.messageOptions').removeClass('d-none');
        $('.chat_fluid__send_box').addClass('d-none');
        if (l3 > 1) {
            $('.messageReplyBtn').addClass('d-none');
        } else {
            $('.messageReplyBtn').removeClass('d-none');
        }
    }
});

$(document).on('click', '.messageDeleteBtn', (e) => {
    askUser(`Delete Message?`, `Delete ${message_pks.length} message(s)?`, (status) => {
        if (status) {
            chatSocket.send(JSON.stringify({
                type: 'delete_message',
                pk: $('#our_pk').val(),
                message_pks: message_pks,
            }));
        }
    });
});

$(document).on('click', '#close_chat', (e) => {
    chatSocket.onclose = function() {} // reset close event to not show an error
    $('.chat_container').addClass('d-none');
    chatSocket.close();
    currChat = undefined;
    to_pk = undefined;
});

$(document).on('click', '.chatConnectRetry', (e) => {
    initChat(first=false);
    clearInterval(timerInterval);
    clearInterval(retryInterval);
});