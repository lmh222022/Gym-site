document.addEventListener('DOMContentLoaded', () => {

    // --- Menu and Typed.js Logic ---
    (function() {
        const menu = document.querySelector('#menu-icon');
        const navbar = document.querySelector('.navbar');
        const multipleTextElement = document.querySelector('.multiple-text');

        if (menu && navbar) {
            menu.onclick = () => {
                menu.classList.toggle('bx-x');
                navbar.classList.toggle('active');
            }
            window.onscroll = () => {
                menu.classList.remove('bx-x');
                navbar.classList.remove('active');
            }
        }
        // Check if Typed library is loaded
        if (multipleTextElement && typeof Typed !== 'undefined') {
            try {
                const typed = new Typed('.multiple-text', {
                    strings: [
                        'Peak Fitness', 'Community', 'Workout Gear', 'Training Plans', 'Motivation', 'Healthy Meal Plans'
                    ],
                    typeSpeed: 70, backSpeed: 50, backDelay: 1200, loop: true, loopDelay: 10000,
                });
            } catch (e) {
                console.error("Typed.js initialization failed:", e);
            }
        } else if (multipleTextElement) {
            console.warn("Typed.js library not found or .multiple-text element missing.");
        }
    })();

    // --- BMI Calculator Logic ---
    const unitRadios = document.querySelectorAll('input[name="unit"]');
    const metricInputsDiv = document.getElementById('metric-inputs');
    const imperialInputsDiv = document.getElementById('imperial-inputs');
    const heightCmInput = document.getElementById('height-cm');
    const weightKgInput = document.getElementById('weight-kg');
    const heightFtInput = document.getElementById('height-ft');
    const heightInInput = document.getElementById('height-in');
    const weightLbsInput = document.getElementById('weight-lbs');
    const calculateBtn = document.getElementById('calculate-bmi');
    const resultDiv = document.getElementById('bmi-result');
    const categoryDiv = document.getElementById('bmi-category');
    const errorDiv = document.getElementById('error-message');
    const historyDiv = document.getElementById('bmi-history');
    const chartCanvas = document.getElementById('bmi-chart');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    // Check if all required BMI elements exist before proceeding
    if (!unitRadios.length || !metricInputsDiv || !imperialInputsDiv || !heightCmInput || !weightKgInput || !heightFtInput || !heightInInput || !weightLbsInput || !calculateBtn || !resultDiv || !categoryDiv || !errorDiv || !historyDiv || !chartCanvas || !clearHistoryBtn) {
        console.error("BMI Calculator Initialization Error: One or more required elements not found.");
        if (errorDiv) errorDiv.textContent = "BMI Calculator failed to load correctly.";
        return;
    }

    let currentUnit = document.querySelector('input[name="unit"]:checked') ? document.querySelector('input[name="unit"]:checked').value : 'metric';
    let bmiChart = null;
    const MAX_HISTORY = 15;

    // --- Helper Functions ---
    function displayError(message) {
        errorDiv.textContent = message;
        resultDiv.textContent = '';
        categoryDiv.textContent = '';
        categoryDiv.className = 'category-display';
        errorDiv.focus();
    }

    function clearResults() {
        resultDiv.textContent = '';
        categoryDiv.textContent = '';
        errorDiv.textContent = '';
        categoryDiv.className = 'category-display';
    }

    function updateInputVisibility() {
        if (currentUnit === 'metric') {
            metricInputsDiv.style.display = 'block';
            imperialInputsDiv.style.display = 'none';
        } else {
            metricInputsDiv.style.display = 'none';
            imperialInputsDiv.style.display = 'block';
        }
    }

    function getBMICategory(bmi) {
        if (bmi < 18.5) return { name: 'Underweight', class: 'category-underweight' };
        if (bmi >= 18.5 && bmi < 25) return { name: 'Normal weight', class: 'category-normal' };
        if (bmi >= 25 && bmi < 30) return { name: 'Overweight', class: 'category-overweight' };
        if (bmi >= 30 && bmi < 35) return { name: 'Obesity Class I', class: 'category-obese1' };
        if (bmi >= 35 && bmi < 40) return { name: 'Obesity Class II', class: 'category-obese2' };
        return { name: 'Obesity Class III', class: 'category-obese3' };
    }

    // --- Local Storage History Functions ---
    function getHistory() {
        try {
            return JSON.parse(localStorage.getItem('bmiHistory') || '[]');
        } catch (e) {
            console.error("Error reading BMI history from localStorage:", e);
            return [];
        }
    }

    function saveHistory(entry) {
        try {
            let history = getHistory();
            history.push(entry);
            if (history.length > MAX_HISTORY) {
                history = history.slice(history.length - MAX_HISTORY);
            }
            localStorage.setItem('bmiHistory', JSON.stringify(history));
        } catch (e) {
            console.error("Error saving BMI history to localStorage:", e);
        }
    }

    function clearHistory() {
        try {
            localStorage.removeItem('bmiHistory');
            renderHistory();
            renderChart();
        } catch (e) {
            console.error("Error clearing BMI history from localStorage:", e);
        }
    }

    // --- Rendering Functions ---
    function renderHistory() {
        const history = getHistory();
        historyDiv.innerHTML = '';

        if (history.length === 0) {
            historyDiv.innerHTML = '<p class="no-history">No history yet. Calculate your BMI to start tracking.</p>';
            clearHistoryBtn.style.display = 'none';
        } else {
            const list = document.createElement('ul');
            list.className = 'history-list';
            const fragment = document.createDocumentFragment();
            history.slice().reverse().forEach(entry => {
                const item = document.createElement('li');
                item.className = 'history-item';
                const bmiValue = parseFloat(entry.bmi);
                if (isNaN(bmiValue)) {
                    console.warn("Skipping invalid history entry:", entry);
                    return;
                }
                const categoryInfo = getBMICategory(bmiValue);
                const formattedDate = new Intl.DateTimeFormat(navigator.language || 'en-GB').format(new Date(entry.date));

                item.innerHTML = `
                    <span class="history-date">${formattedDate}</span>
                    <span class="history-bmi">BMI: ${entry.bmi}</span>
                    <span class="history-category ${categoryInfo.class}">${categoryInfo.name}</span>
                `;
                fragment.appendChild(item);
            });
            list.appendChild(fragment);
            historyDiv.appendChild(list);
            clearHistoryBtn.style.display = 'block';
        }
    }

    function renderChart() {
        if (typeof Chart === 'undefined') {
            console.warn("Chart.js library not found. BMI chart cannot be rendered.");
            const chartContainer = chartCanvas.parentNode;
            if (chartContainer) {
                chartContainer.innerHTML = '<p class="chart-placeholder">Chart library not loaded.</p>';
            }
            return;
        }
        const ctx = chartCanvas.getContext('2d');
        if (!ctx) {
            console.error("Could not get 2D context for chart canvas.");
            const chartContainer = chartCanvas.parentNode;
            if (chartContainer) {
                chartContainer.innerHTML = '<p class="chart-placeholder">Could not initialize chart.</p>';
            }
            return;
        }

        const history = getHistory();
        const validHistory = history.filter(entry => !isNaN(parseFloat(entry.bmi)));

        if (validHistory.length === 0) {
            const chartContainer = chartCanvas.parentNode;
            if (chartContainer) {
                chartContainer.innerHTML = '<p class="chart-placeholder">No history data for chart.</p>';
            }
            if (bmiChart) {
                bmiChart.destroy();
                bmiChart = null;
            }
            return;
        }

        const labels = validHistory.map(entry => new Intl.DateTimeFormat(navigator.language || 'en-GB', { month: 'short', day: 'numeric' }).format(new Date(entry.date)));
        const data = validHistory.map(entry => parseFloat(entry.bmi));

        const chartData = {
            labels: labels,
            datasets: [{
                label: 'BMI History',
                data: data,
                fill: false,
                borderColor: 'orange',
                backgroundColor: 'orange',
                tension: 0.1,
                pointRadius: 4,
                pointHoverRadius: 6,
            }]
        };

        const config = {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: { color: '#ccc', padding: 10 },
                        grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false }
                    },
                    x: {
                        ticks: { color: '#ccc', maxRotation: 0, autoSkip: true, maxTicksLimit: 7, padding: 10 },
                        grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'orange',
                        bodyColor: '#eee',
                        padding: 10,
                        cornerRadius: 4,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `BMI: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
            }
        };

        if (bmiChart) {
            bmiChart.destroy();
        }
        bmiChart = new Chart(ctx, config);
    }

    // --- Event Listeners ---
    unitRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            currentUnit = event.target.value;
            updateInputVisibility();
            clearResults();
        });
    });

    calculateBtn.addEventListener('click', () => {
        clearResults();
        let heightMeters = NaN;
        let weightKgValue = NaN;
        let isValid = true;
        let errorMessage = "";

        try {
            if (currentUnit === 'metric') {
                const heightCm = parseFloat(heightCmInput.value);
                weightKgValue = parseFloat(weightKgInput.value);

                if (isNaN(heightCm) || heightCm < 50 || heightCm > 300) {
                    errorMessage = "Please enter a valid height between 50 and 300 cm.";
                    isValid = false;
                    heightCmInput.focus();
                } else if (isNaN(weightKgValue) || weightKgValue < 10 || weightKgValue > 500) {
                    errorMessage = "Please enter a valid weight between 10 and 500 kg.";
                    isValid = false;
                    weightKgInput.focus();
                } else {
                    heightMeters = heightCm / 100;
                }

            } else {
                const heightFt = parseFloat(heightFtInput.value);
                const heightIn = parseFloat(heightInInput.value) || 0;
                const weightLbsValue = parseFloat(weightLbsInput.value);

                if (isNaN(heightFt) || heightFt < 1 || heightFt > 9 || isNaN(heightIn) || heightIn < 0 || heightIn >= 12) {
                    errorMessage = "Please enter a valid height (1-9 ft, 0-11 in).";
                    isValid = false;
                    heightFtInput.focus();
                } else if (heightFt === 0 && heightIn === 0) {
                    errorMessage = "Height cannot be zero.";
                    isValid = false;
                    heightFtInput.focus();
                } else if (isNaN(weightLbsValue) || weightLbsValue < 20 || weightLbsValue > 1100) {
                    errorMessage = "Please enter a valid weight between 20 and 1100 lbs.";
                    isValid = false;
                    weightLbsInput.focus();
                } else {
                    const totalInches = (heightFt * 12) + heightIn;
                    heightMeters = totalInches * 0.0254;
                    weightKgValue = weightLbsValue * 0.453592;
                }
            }

            if (isValid) {
                if (heightMeters <= 0 || weightKgValue <= 0) {
                    displayError("Height and weight must be positive values.");
                    return;
                }

                const bmi = weightKgValue / (heightMeters * heightMeters);
                if (isNaN(bmi) || !isFinite(bmi)) {
                    displayError("Could not calculate BMI. Please check your inputs.");
                    return;
                }

                const bmiRounded = bmi.toFixed(1);
                const categoryInfo = getBMICategory(bmi);

                resultDiv.textContent = `Your BMI is: ${bmiRounded}`;
                categoryDiv.textContent = `Category: ${categoryInfo.name}`;
                categoryDiv.className = `category-display ${categoryInfo.class}`;

                saveHistory({ date: new Date().toISOString(), bmi: bmiRounded });
                renderHistory();
                renderChart();

            } else {
                displayError(errorMessage);
            }
        } catch (e) {
            console.error("Error during BMI calculation:", e);
            displayError("An unexpected error occurred during calculation.");
        }
    });

    const allBmiInputs = document.querySelectorAll('#bmi-tracker .input-section input[type="number"]');
    allBmiInputs.forEach(input => {
        input.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                calculateBtn.click();
            }
        });
    });

    clearHistoryBtn.addEventListener('click', clearHistory);

    // --- Initial Setup ---
    updateInputVisibility();
    renderHistory();
    renderChart();

    // --- Macro Calculator Logic ---
    const ageInput = document.getElementById('age');
    const sexSelect = document.getElementById('sex');
    const activityLevelSelect = document.getElementById('activity-level');
    const goalSelect = document.getElementById('goal');
    const calculateMacrosBtn = document.getElementById('calculate-macros');
    const calorieResultDiv = document.getElementById('calorie-result');
    const macroResultsDiv = document.getElementById('macro-results');
    const macroErrorDiv = document.getElementById('macro-error-message');

    if (!ageInput || !sexSelect || !activityLevelSelect || !goalSelect || !calculateMacrosBtn || !calorieResultDiv || !macroResultsDiv || !macroErrorDiv) {
        console.error("Macro Calculator Initialization Error: One or more required elements not found.");
        if (macroErrorDiv) macroErrorDiv.textContent = "Macro Calculator failed to load correctly.";
        if (calculateMacrosBtn) calculateMacrosBtn.disabled = true;
    } else {
        function displayMacroError(message) {
            macroErrorDiv.textContent = message;
            calorieResultDiv.textContent = '';
            macroResultsDiv.textContent = '';
            macroErrorDiv.focus();
        }

        function clearMacroResults() {
            calorieResultDiv.textContent = '';
            macroResultsDiv.textContent = '';
            macroErrorDiv.textContent = '';
        }

        function calculateBMR(weightKg, heightCm, age, sex) {
            return sex === 'male'
                ? (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5
                : (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
        }

        function calculateTDEE(bmr, activityLevel) {
            return bmr * activityLevel;
        }

        function adjustCaloriesForGoal(tdee, goal) {
            return goal === 'lose' ? tdee - 500 : goal === 'gain' ? tdee + 300 : tdee;
        }

        function calculateMacros(totalCalories, weightKg, goal) {
            let proteinMultiplier = goal === 'gain' || goal === 'lose' ? 2.0 : 1.8;
            let proteinGrams = Math.round(weightKg * proteinMultiplier);
            let fatGrams = Math.round((totalCalories * 0.25) / 9);
            let remainingCalories = totalCalories - (proteinGrams * 4) - (fatGrams * 9);
            let carbGrams = Math.max(0, Math.round(remainingCalories / 4));
            return { calories: Math.round(totalCalories), protein: proteinGrams, carbs: carbGrams, fat: fatGrams };
        }

        calculateMacrosBtn.addEventListener('click', () => {
            clearMacroResults();
            let isValid = true;
            let errorMessage = "";

            let weightKgValue = parseFloat(weightKgInput.value);
            let heightCmValue = parseFloat(heightCmInput.value);
            const currentBmiUnit = document.querySelector('input[name="unit"]:checked')?.value || 'metric';

            if (currentBmiUnit === 'imperial') {
                const heightFt = parseFloat(heightFtInput.value);
                const heightIn = parseFloat(heightInInput.value) || 0;
                const weightLbsValue = parseFloat(weightLbsInput.value);
                if (!isNaN(heightFt) && heightFt > 0 && !isNaN(weightLbsValue) && weightLbsValue > 0) {
                    heightCmValue = (heightFt * 12 + heightIn) * 2.54;
                    weightKgValue = weightLbsValue * 0.453592;
                } else {
                    isValid = false;
                    errorMessage = "Please enter valid Height & Weight in the BMI section first.";
                    heightFtInput.focus();
                }
            }

            if (isNaN(heightCmValue) || heightCmValue <= 0 || isNaN(weightKgValue) || weightKgValue <= 0) {
                isValid = false;
                errorMessage = "Please enter valid Height & Weight in the BMI section first.";
                heightCmInput.focus();
            }

            const age = parseInt(ageInput.value);
            const sex = sexSelect.value;
            const activityLevel = parseFloat(activityLevelSelect.value);
            const goal = goalSelect.value;

            if (isNaN(age) || age < 15 || age > 100) {
                isValid = false;
                errorMessage = "Please enter a valid age (15-100).";
                ageInput.focus();
            } else if (!sex) {
                isValid = false;
                errorMessage = "Please select your sex.";
                sexSelect.focus();
            } else if (isNaN(activityLevel)) {
                isValid = false;
                errorMessage = "Please select an activity level.";
                activityLevelSelect.focus();
            } else if (!goal) {
                isValid = false;
                errorMessage = "Please select your goal.";
                goalSelect.focus();
            }

            if (isValid) {
                try {
                    const bmr = calculateBMR(weightKgValue, heightCmValue, age, sex);
                    const tdee = calculateTDEE(bmr, activityLevel);
                    const targetCalories = adjustCaloriesForGoal(tdee, goal);
                    const macros = calculateMacros(targetCalories, weightKgValue, goal);

                    calorieResultDiv.textContent = `Target Calories: ≈ ${macros.calories} kcal`;
                    macroResultsDiv.innerHTML = `
                        <span>Protein: ≈ ${macros.protein} g</span>
                        <span>Carbs: ≈ ${macros.carbs} g</span>
                        <span>Fat: ≈ ${macros.fat} g</span>
                    `;
                } catch (e) {
                    console.error("Error during macro calculation:", e);
                    displayMacroError("Could not calculate macros. Please check all inputs.");
                }
            } else {
                displayMacroError(errorMessage);
            }
        });

        document.querySelectorAll('.macro-calculator-card input, .macro-calculator-card select').forEach(input => {
            input.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    calculateMacrosBtn.click();
                }
            });
        });
    }

});