"use strict";

import cityDatabase from './citiesDB.js';

function timeCalc(hours, minutes, city = "SVO", svo = 3) {
    if (!cityDatabase.hasOwnProperty(city)) {
        throw new Error(`Города: ---> ${city} <--- Нет в базе с UTC.`);
    }

    const localFlightTime = new Date();
    localFlightTime.setUTCHours(hours);
    localFlightTime.setUTCMinutes(minutes);

    const minusFortyMinutes = 40 * 60 * 1000; // 40 minutes in milliseconds
    const targetShiftHours = cityDatabase[city][1] - svo;
    const targetShiftMinutes = cityDatabase[city][2];

    const shiftInMilliseconds =
        (targetShiftHours * 60 + targetShiftMinutes) * 60 * 1000;

    const timeLimit = new Date(
        localFlightTime - shiftInMilliseconds - minusFortyMinutes
    );

    return timeLimit.toISOString().substr(11, 5); // Format as HH:mm
}

function telegram_time_calc(hours, minutes, city = "SVO") {
    if (!cityDatabase.hasOwnProperty(city)) {
        throw new Error(`Города: ---> ${city} <--- Нет в базе с UTC.`);
    }

    const telegramTime = new Date();
    telegramTime.setUTCHours(hours);
    telegramTime.setUTCMinutes(minutes);

    const targetShiftHours = cityDatabase[city][1];
    const targetShiftMinutes = cityDatabase[city][2];

    const shiftInMilliseconds =
        (targetShiftHours * 60 + targetShiftMinutes) * 60 * 1000;

    const telegramResult = new Date(
        telegramTime.getTime() + shiftInMilliseconds
    );

    return telegramResult.toISOString().substr(11, 5); // Format as HH:mm
}

function addLeadingZero(number) {
    return (number < 10 ? "0" : "") + number;
}

// Функция форматирования времени
function formatTime(hours, minutes) {
    return addLeadingZero(hours) + ":" + addLeadingZero(minutes);
}

function minus36HoursMoscowTime(hours, minutes, city) {
    const totalStartMinutes = hours * 60 + minutes;
    const cityOffset =
        cityDatabase[city.toUpperCase()][1] * 60 +
        cityDatabase[city.toUpperCase()][2];
    const moscowOffset =
        cityDatabase["SVO"][1] * 60 + cityDatabase["SVO"][2];
    const offsetDifference = moscowOffset - cityOffset;
    let totalEndMinutes = totalStartMinutes - 36 * 60 + offsetDifference; // Изменили знак для правильного вычитания
    let days = 0;
    while (totalEndMinutes < 0) {
        days--;
        totalEndMinutes += 24 * 60;
    }
    const endHours = Math.floor(totalEndMinutes / 60);
    const endMinutes = totalEndMinutes % 60;
    return {days: days, hours: endHours, minutes: endMinutes};
}

function minus36HoursLocalTime(hours, minutes) {
    // Переводим переданное время в минуты
    const totalStartMinutes = hours * 60 + minutes;

    // Вычитаем 36 часов (36 * 60 минут)
    let totalEndMinutes = totalStartMinutes - 36 * 60;

    // Определение количества дней, если результат отрицательный
    let days = 0;
    while (totalEndMinutes < 0) {
        days--;
        totalEndMinutes += 24 * 60; // Добавляем 24 часа в минутах
    }

    // Определение часов и минут после вычитания 36 часов
    const endHours = Math.floor(totalEndMinutes / 60);
    const endMinutes = totalEndMinutes % 60;

    // Возвращаем результат
    return {days: days, hours: endHours, minutes: endMinutes};
}

function showError(message) {
    alert(`Ошибка: ${message}`);
}

function calculateTime() {
    try {
        const citySelect = document.getElementById("citySelect");
        const selectedCity =
            citySelect.options[citySelect.selectedIndex].value;

        const timeInputValue = document.getElementById("timeInput").value;
        let hours, minutes;

        if (timeInputValue.length === 4) {
            hours = parseInt(timeInputValue.substring(0, 2), 10);
            minutes = parseInt(timeInputValue.substring(2), 10);
        } else if (timeInputValue.includes(":")) {
            [hours, minutes] = timeInputValue.split(":").map(Number);
        } else {
            throw new Error(
                "Неверный формат времени. Используйте HH:mm или HHmm."
            );
        }

        if (isNaN(hours) || isNaN(minutes)) {
            throw new Error(
                "Неверный формат времени. Используйте HH:mm или HHmm."
            );
        }

        const localTimeResult = timeCalc(
            hours,
            minutes,
            selectedCity.toUpperCase()
        );
        const telegramTimeResult = telegram_time_calc(
            hours,
            minutes,
            selectedCity.toUpperCase()
        );
        const moscowTimeAfterSubtraction = minus36HoursMoscowTime(
            hours,
            minutes,
            selectedCity.toUpperCase()
        );
        const timeAfterSubtraction = minus36HoursLocalTime(hours, minutes);

        document.getElementById(
            "result"
        ).textContent = `Время для ручного TL при пересадке: [ ${localTimeResult} ]`;
        document.getElementById(
            "telegramResult"
        ).textContent = `Местное время вылета из Модуля Телеграм: [ ${telegramTimeResult} ]`;
        document.getElementById(
            "minus36HoursMoscow"
        ).textContent = `Минус 36 часов по Москве: Дни [ ${
            moscowTimeAfterSubtraction.days
        } ] Время [ ${formatTime(
            moscowTimeAfterSubtraction.hours,
            moscowTimeAfterSubtraction.minutes
        )} ]`;
        document.getElementById(
            "minus36HoursLocal"
        ).textContent = `Минус 36 часов Локально: Дни [ ${
            timeAfterSubtraction.days
        } ] Время [ ${formatTime(
            timeAfterSubtraction.hours,
            timeAfterSubtraction.minutes
        )} ]`;
    } catch (error) {
        showError(error.message);
        console.error(error.message);
    }
}

window.addEventListener("load", function () {
    const citySelect = document.getElementById("citySelect");
    for (const cityCode in cityDatabase) {
        const cityName = cityDatabase[cityCode][0];
        const option = document.createElement("option");
        option.value = cityCode;
        const utcString =
            (cityDatabase[cityCode][1] >= 0 ? "+" : "-") +
            Math.abs(cityDatabase[cityCode][1]).toString().padStart(2, "0") +
            ":" +
            cityDatabase[cityCode][2].toString().padStart(2, "0");
        option.textContent = `${cityCode} ${cityName} UTC${utcString}`;
        citySelect.appendChild(option);
    }

    const container = document.getElementById("container");
    const width = container.offsetWidth;

    const inputs = document.querySelectorAll("input, select, button");
    inputs.forEach((input) => {
        input.style.width = `${width}px`;
    });
});

document
    .getElementById("timeInput")
    .addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
            calculateTime();
        }
    });
document.querySelector("button").addEventListener("click", () => {
    calculateTime();
})