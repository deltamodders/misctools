let isAlertShowing = false;

async function htmlAlertRaw(title, message, buttons, specialIcon = 'info') {
    return new Promise(async (resolve, reject) => {
        isAlertShowing = true;
        var alertMain = document.getElementsByClassName('alertMain')[0];
        var alertMsgR = alertMain.getElementsByClassName('alertMsg')[0];

        var animOptions = 'cubic-bezier(0.16, 1, 0.3, 1) forwards';
        var animLength = 0.6;

        alertMsgR.innerHTML = '';

        // Container
        var alertMsg = document.createElement('div');
        alertMsgR.appendChild(alertMsg);

        // Title
        var titleElement = document.createElement('h1');
        titleElement.innerText = title;
        titleElement.style.opacity = '0';
        
        // Message
        var messageElement = document.createElement('p');
        messageElement.innerHTML = message.replace(/\n/g, '<br>');
        messageElement.style.opacity = '0';
        
        alertMsg.appendChild(titleElement);
        alertMsg.appendChild(messageElement);

        // Buttons
        var buttonsHTML = document.createElement('div');
        buttonsHTML.style.textAlign = 'right';
        buttonsHTML.classList.add('alertButtons');
        buttonsHTML.style.opacity = '0';
        buttonsHTML.style.display = 'flex';
        buttonsHTML.style.gap = '8px';
        buttonsHTML.style.justifyContent = 'flex-end';
        

        buttons.forEach((button) => {
            var btn = document.createElement('button');
            btn.textContent = button.text;
            btn.style.flex = '1 1 0';
            btn.onclick = function() {
                // Outro animation
                alertMsgR.style.animation = `${animLength}s alertFadeOut ${animOptions}`;
                setTimeout(() => {
                    alertMain.style.animation = '';
                    alertMain.style.display = 'none';
                    alertMsgR.style.animation = `${animLength}s alertFadeIn ${animOptions}`;
                    alertMsgR.innerHTML = '';
                }, 300);
                
                isAlertShowing = false;
                
                // Play dismiss SFX
                var a = new Audio();
                a.src = 'ha2.mp3';
                a.play();
                console.log('Alert dismissed.');

                // Resolve/Reject
                if (button.resolveWith) {
                    resolve(button.resolveWith);
                    return;
                }
                if (button.rejectWith) {
                    reject(button.rejectWith);
                    return;
                }
                if (button.onClick) button.onClick();
            };
            buttonsHTML.appendChild(btn);
        });

        alertMain.style.display = 'flex';
        alertMsg.appendChild(buttonsHTML);

        // Special Background Icon
        var bigIcon = document.createElement('span');
        bigIcon.classList.add('material-symbols-outlined', 'alertBigIcon');
        bigIcon.innerText = specialIcon;
        bigIcon.style.fontSize = '490px';
        bigIcon.style.position = 'absolute';
        bigIcon.style.top = '-140px';
        bigIcon.style.right = '-50px';
        bigIcon.style.opacity = '0.1';
        bigIcon.style.userSelect = 'none';
        bigIcon.style.pointerEvents = 'none';
        alertMsgR.appendChild(bigIcon);

        // Cascade Intro Animations
        setTimeout(() => { titleElement.style.animation = `${animLength*1.2}s stuffFadeIn ${animOptions}`; }, 200);
        setTimeout(() => { messageElement.style.animation = `${animLength*1.2}s stuffFadeIn ${animOptions}`; }, 300);
        setTimeout(() => { buttonsHTML.style.animation = `${animLength*1.2}s stuffFadeIn ${animOptions}`; }, 400);

        // Play alert SFX
        var a = new Audio();
        a.src = 'ha1.mp3';
        a.playbackRate = 0.9;
        a.play();
    });
}

setTimeout(async () => {
    var ad = document.querySelector('iframe[title="BidVertiser advertisement"]');

    if (!ad) {
        /**await htmlAlertRaw(
            'Adblocks', 
            'We have detected that you have an adblocker. That\'s not a problem, but if you disable it, it would help us out a lot. Please disable your adblocker!', 
            [{ text: 'OK', resolveWith: true }],
             'warning'
        );*/
    }
}, 2000);