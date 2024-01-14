const NOTIONWHITE = "#D6D6D6";
const NOTIONGRAY = "#868686";
const NOTIONORANGE = "#D87620";

function updateCounter(value) { // updates onscreen counter with given param
    const counterRef = document.getElementById("counter");
    counterRef.textContent = value;
}

function handleSliderChange() { // called when slider is moved to update counter + circle
    const sliderRef = document.getElementById("slider");
    const percent = sliderRef.value;
    changePercentage(percent);
    updateCounter(percent); 
}

function changePercentage(percent) { // updates onscreen progress circle to given param
    
    // calculates the percentages to draw the radii out from the center
    const angle = percent / 100 * (Math.PI * 2);
    const xPercent = (Math.sin(angle) + 1) * 50;
    const yPercent = (Math.sin(angle - Math.PI / 2) + 1) * 50;
    let clipPathValue = "polygon(50% 0%, 50% 50%" + ', ' + xPercent + '% ' + yPercent + '%';

    // traverses to nearby corner then heads counter clockwise to top left
    let returnPath = ')';
    if (percent > 0) {
        returnPath = ', 100% 0%' + returnPath;
        if (percent > 25) {
            returnPath = ', 100% 100%' + returnPath;
            if (percent > 50) {
                returnPath = ', 0% 100%' + returnPath;
                if (percent > 75) {
                    returnPath = ', 0% 0%' + returnPath;
                }
            }
        }
    }
    clipPathValue += returnPath;

    // changes the appearance of the circle
    const circleRef = document.querySelector('.filler');
    circleRef.style.clipPath = clipPathValue;
}

function swapTabs(prev, next) {
    // change color of clicked tab name
    const prevSelectorRef = document.querySelector('.t' + prev);
    prevSelectorRef.style.color = NOTIONGRAY;
    prevSelectorRef.style.borderBottom = "solid transparent";

    const clickedSelectorRef = document.querySelector('.t' + next);
    clickedSelectorRef.style.color = NOTIONWHITE;
    clickedSelectorRef.style.borderBottom = "solid #D6D6D6";

    

    // change displayed tab
    const prevTabRef = document.querySelector('.s' + prev);
    prevTabRef.style.display = "none";
    const selectedTabRef = document.querySelector('.s' + next);
    selectedTabRef.style.display = "inline";
}

function handleTabChange(elem) {
    const savedItem = sessionStorage.getItem('currIndex');
    const retrievedItem = JSON.parse(savedItem);
    let prevIndex = retrievedItem ? retrievedItem : '1';

    if (elem.id != prevIndex) {
        // close delete menu if necessary
        if ((prevIndex === "2" && assignmentDeleteStateOn) ||
            (prevIndex === "3" && weightDeleteStateOn)) {
                toggleDeleteButtons();

            }

        // swap display to the clicked tab
        swapTabs(prevIndex, elem.id);

        // store new tab in local storage
        const jsonToSave = JSON.stringify(elem.id);
        sessionStorage.setItem('currIndex', jsonToSave);
    }
}

function handleItemInput(idNum, isAssignmentsPage) {
    // extract the edited row's input boxes' values from the DOM
    const categoryIdObj = {
        'wn' : 'name',
        'ww' : 'weight'
    }
    const assignmentIdObj = {'an' : 'name', 
                                'as' : 'score', 
                                'at' : 'total', 
                                'ac' : 'category'};
    const idPrefixToParamName = isAssignmentsPage ? assignmentIdObj : categoryIdObj;

    // construct the new object via the appropriate input DOM elements
    const newItem = {id : idNum};
    for (const [idPrefix, paramName] of Object.entries(idPrefixToParamName)) {
        const paramValue = document.getElementById(idPrefix + idNum).value;

        // if entry is empty, set param to null
        if (paramValue.length !== 0) {
            newItem[paramName] = paramValue;
        } else {
            newItem[paramName] = null;
        }
        
    }

    // grab current page's list from local storage, filter out old entry and replace with new
    const sessionStorageKey = isAssignmentsPage ? "assignmentList" : "categoryList";
    const itemListJSON = sessionStorage.getItem(sessionStorageKey);
    let filteredItemList = [];
    if (itemListJSON !== null) {
        const storedCategoryList = JSON.parse(itemListJSON);
        // filter out the old information that was stored
        filteredItemList = storedCategoryList.filter((e) => e.id !== idNum);
        filteredItemList.push(newItem);
    } else {
        filteredItemList.push(newItem);
    }
    
    // store the newly formatted list back into local storage
    const newItemListJSON = JSON.stringify(filteredItemList);
    console.log(filteredItemList);
    sessionStorage.setItem(sessionStorageKey, newItemListJSON);

    // change the assignment page to reflect any changes to the category list
    if (!isAssignmentsPage) {
        syncAllSelectInputs();
    }

    setHomeDisplay();
}

function createInputElement(inputType, className, value, id, inputOnChange) {
    const newInput = document.createElement("input");
    newInput.type = inputType;
    newInput.className = className;
    newInput.value = value ? value : "";
    newInput.id = id;
    newInput.onchange = function() { inputOnChange() };
    return newInput;
}

function createCategoryList() {
    const savedCategories = sessionStorage.getItem('categoryList');
    const categoryList = JSON.parse(savedCategories);

    const optionElemList = [];

    categoryList.forEach((e) => {
        const newOption = document.createElement("option");
        newOption.text = e.name;
        newOption.value = e.name;

        optionElemList.push(newOption);
    })
    return optionElemList;
}

function createSelectElement(inputCategory, id, inputOnChange) {
    // create a new select element and set its class + id
    const selectInput = document.createElement("select");
    selectInput.className = "table-input";
    selectInput.id = "ac" + id;

    // call constructor method for all value html elements and append to select element
    const optionElemList = createCategoryList();
    optionElemList.forEach((e) => {
        selectInput.appendChild(e);
    });
    selectInput.value = inputCategory;

    selectInput.onchange = function() { inputOnChange() };
    return selectInput;
    
}

function addCategoryRow(category, idNum) { // onclick to add row to the category table
    const nameInput = createInputElement("text", "table-input", category.name, "wn" + idNum, () => {handleItemInput(idNum, false)});
    const weightInput = createInputElement("number", "table-input number-input", category.weight, "ww" + idNum, () => {handleItemInput(idNum, false)});

    const inputItems = [nameInput, weightInput];
    const row = document.createElement("tr");
    row.id = "wr" + idNum;

    inputItems.forEach((e) => {
        const newCol = document.createElement("td");
        newCol.appendChild(e);
        row.appendChild(newCol);
    })

    const allRowBodies = document.getElementsByTagName('tbody');
    allRowBodies[1].appendChild(row);
}

function addAssignmentRow(assignment, idNum) { // onClick to add row to the assignment table
    const textInput = createInputElement("text", "table-input mini-input", assignment.name, 'an' + idNum, () => {handleItemInput(idNum, true)});
    const scoreInput = createInputElement("number", "table-input number-input", assignment.score, 'as' + idNum, () => {handleItemInput(idNum, true)});
    const totalInput = createInputElement("number", "table-input number-input", assignment.total, 'at' + idNum, () => {handleItemInput(idNum, true)});
    const selectInput = createSelectElement(assignment.category, idNum, () => {handleItemInput(idNum, true)});
    

    const row = document.createElement("tr");
    row.id = "ar" + idNum;

    const inputItems = [textInput, scoreInput, totalInput, selectInput];
    inputItems.forEach((e) => {
        const newCol = document.createElement("td");
        newCol.appendChild(e);
        row.appendChild(newCol);
    })

    const allRowBodies = document.getElementsByTagName('tbody');
    allRowBodies[0].appendChild(row);
}

function deleteItem(idNum, isAssignmentsPage) {
    // grab the row and remove it from the display
    const idPrefix = isAssignmentsPage ? 'ar' : 'wr';
    const rowRef = document.getElementById(idPrefix + idNum);
    rowRef.style.display = "none";

    // delete the associated item from local storage
    const intIdNum = parseInt(idNum);

    const sessionStorageKey = isAssignmentsPage ? 'assignmentList' : 'categoryList';
    const retrievedItem = sessionStorage.getItem(sessionStorageKey);
    const storedItemList = JSON.parse(retrievedItem);
    const filteredItemList = storedItemList.filter((e) => e.id !== parseInt(intIdNum));

    // place filtered list back into local storage
    const filteredItemListJSON = JSON.stringify(filteredItemList);
    sessionStorage.setItem(sessionStorageKey, filteredItemListJSON);

    if (!isAssignmentsPage) {
        syncAllSelectInputs();
    }
}

function createDeleteButton(idNum, isAssignmentsPage) {
    const idPrefix = isAssignmentsPage ? "ad" : "wd";
    const deleteButtonRef = document.createElement("button");
    deleteButtonRef.textContent = "-";
    deleteButtonRef.id = idPrefix + idNum;
    deleteButtonRef.className = "delete-button";
    deleteButtonRef.onclick = () => {deleteItem(idNum, isAssignmentsPage)};
    return deleteButtonRef;
}

function removeAllDeleteButtons(tbodyRef) {
    // grab a list of all delete buttons
    const buttonList = tbodyRef.getElementsByTagName("button");

    // delete all buttons
    while (buttonList.length > 0) {
        buttonList[0].remove();
    }
}

function insertAllDeleteButtons(tbodyRef, isAssignmentsPage) {
    // grab list of all rows from the DOM
    const trList = tbodyRef.getElementsByTagName('tr');
        
    for (let i = 0; i < trList.length; i++) {
        // extract the necessary column from the DOM
        const trRef = trList[i];
        const tdRef = trRef.getElementsByTagName('td')[0];

        // extract the current row's id from the DOM
        const fullId = tdRef.getElementsByTagName("input")[0].id;
        const idNum = fullId.substring(2, fullId.length);

        // create the new button and append to the current row's 1st column
        const deleteButton = createDeleteButton(idNum, isAssignmentsPage);
        tdRef.insertBefore(deleteButton, tdRef.firstChild);
    }
}

function syncAllSelectInputs() {
    // grab all select elements on assignment page
    const assignmentDivRef = document.getElementById("ass-con");
    const selectElemList = assignmentDivRef.getElementsByTagName("select");

    // grab a list of all categories + create corresponding DOM elements
    const optionElemList = createCategoryList();
    const optionList = optionElemList.map((e) => e.value);

    // iterate over select elements and sync to new list of categories
    for (let i = 0; i < selectElemList.length; i++) {
        // grab the select element from the DOM along with its current selection
        const selectElem = selectElemList[i];
        const oldSelect = selectElem.value;
        
        // replace all old values with new ones + edit the select value to what it was previously
        selectElem.replaceChildren(...optionElemList);
        if (optionList.includes(oldSelect)) {
            selectElem.value = oldSelect;
        } else {
            // if the option was removed, set display value to null
            selectElem.value = null;
        }
        selectElem.value = oldSelect;
    }

    // sync all assignments in local storage to updated category list
    const retrievedAssignmentJSON = sessionStorage.getItem("assignmentList");
    const retrievedAssignmentList = JSON.parse(retrievedAssignmentJSON);
    for (let i = 0; i < retrievedAssignmentList.length; i++) {
        const assignment = retrievedAssignmentList[i];
        if (!optionList.includes(assignment.category)) {
            assignment.category = null;
        }
    }

    // return assignmentList back into JSON and store in local storage
    const newAssignmentListJSON = JSON.stringify(retrievedAssignmentList);
    sessionStorage.setItem("assignmentList", newAssignmentListJSON);
}

let weightDeleteStateOn = false;
let assignmentDeleteStateOn = false;
function toggleDeleteButtons() {
    // determine which table page we currently are on
    const savedIndex = sessionStorage.getItem('currIndex');
    const retrievedIndex = JSON.parse(savedIndex); 
    const isAssignmentsPage = retrievedIndex === "2";

    // set table body + toggle delete on/off based on current page selection
    if (isAssignmentsPage) {
        var tbodyRef = document.getElementsByTagName('tbody')[0];
        assignmentDeleteStateOn = !assignmentDeleteStateOn;
    } else {
        var tbodyRef = document.getElementsByTagName('tbody')[1];
        weightDeleteStateOn = !weightDeleteStateOn;
    }

    // add or remove all delete buttons on current page
    if ((isAssignmentsPage && assignmentDeleteStateOn) || 
        (!isAssignmentsPage && weightDeleteStateOn)) {
        insertAllDeleteButtons(tbodyRef, isAssignmentsPage);
    } else {
        removeAllDeleteButtons(tbodyRef);
    }
}

function calculateGrade() {
    // attempt to fetch assignments + categories from local storage
    const retrievedAssignments = sessionStorage.getItem("assignmentList");
    const retrievedCategories = sessionStorage.getItem("categoryList");
    if (!retrievedAssignments || !retrievedCategories) {
        return null;
    }

    const savedAssignments = JSON.parse(retrievedAssignments);
    const savedCategories = JSON.parse(retrievedCategories);

    // create hashmap of category name to score and total object AND category name to weight
    const catPointTotals = {};
    const catWeightPairs = {};
    savedCategories.forEach((e) => {
        catPointTotals[e.name] = {score : 0, total : 0};
        catWeightPairs[e.name] = parseFloat(e.weight) ? parseFloat(e.weight) / 100 : 0;
    })

    // populate hashmap with assignment point totals
    savedAssignments.forEach((e) => {
        const currPointTotal = catPointTotals[e.category];
        if (currPointTotal && parseFloat(e.score) && parseFloat(e.total)) {
            currPointTotal.score += parseFloat(e.score);
            currPointTotal.total += parseFloat(e.total);
        }
    });

    // if there are no existing categories, return NA
    const catNameToPointTotals = Object.entries(catPointTotals)
    if (catNameToPointTotals.length === 0) {
        return null;
    }
    // iterate over hashmap to calculate weights and sum up totals
    let finalGrade = 0;
    for (const [catName, pointTotal] of catNameToPointTotals) {
        console.log(catName + "(" +  + pointTotal.score + "/" + pointTotal.total);
        const catScoreRatio = pointTotal.score / pointTotal.total;
        if (catWeightPairs[catName]) {
            if (pointTotal.total !== 0) {
                finalGrade += catWeightPairs[catName] * catScoreRatio;
            } else {
                finalGrade += catWeightPairs[catName];
            }
            
        }
    }
    
    return Math.round(finalGrade * 10000) / 100;
}

function setHomeDisplay() {
    const grade = calculateGrade();
    const innerLabelRef = document.getElementById("inner-label");
    if (grade !== null) {
        innerLabelRef.textContent = grade + "%";
        changePercentage(grade);
    } else {
        innerLabelRef.textContent = "NA";
        changePercentage(100);
    }
    
    
}

// code that runs on page load ---------------------------------------------------

// swap to the previously selected page
const savedIndex = sessionStorage.getItem('currIndex');
const retrievedIndex = JSON.parse(savedIndex);
let currIndex = retrievedIndex ? retrievedIndex : '1';
swapTabs('1', currIndex);

// add all category rows
const savedCategories = sessionStorage.getItem('categoryList');
const categoryList = JSON.parse(savedCategories);
const newCategoryList = [];
if (categoryList !== null && categoryList.length !== 0) {
    for (let i = 0; i < categoryList.length; i++) {
        // relabel saved category ids from 0 to n (no skips due to deletes)
        const category = categoryList[i];
        category.id = i;
        newCategoryList.push(category);

        // add a row to represent the saved category
        addCategoryRow(category, i); 
    }
    
} else {
    addCategoryRow({}, 0);
}
// reset all ids based on order in json list (or add empty list if it doesn't exist)
const newCategoryListJSON = JSON.stringify(newCategoryList);
sessionStorage.setItem("categoryList", newCategoryListJSON);


// add all assignment rows
const savedAssignments = sessionStorage.getItem('assignmentList');
const assignmentList = JSON.parse(savedAssignments);
const newAssignmentList = [];
if (assignmentList !== null && assignmentList.length !==0) {
    for (let i = 0; i < assignmentList.length; i++) {
        // relabel saved assignemnts ids from 0 to n (no skips due to deletes)
        const assignment = assignmentList[i];
        assignment.id = i;
        newAssignmentList.push(assignment);

        // add a row to represent the saved assignment
        addAssignmentRow(assignment, i);
    }
    
} else {
    // if no rows are saved in local storage, add a blank one with index 0
    addAssignmentRow({}, 0);
}
// reset all ids based on order in json list (or add empty list if it doesn't exist)
const newAssignmentListJSON = JSON.stringify(newAssignmentList);
sessionStorage.setItem("assignmentList", newAssignmentListJSON);


let uniqueCatId = categoryList ? categoryList.length : 0; 
function getNextUniqueCatId() {
    uniqueCatId += 1;
    return uniqueCatId;
}

let uniqueAssId = assignmentList ? assignmentList.length : 0;
function getNextUniqueAssId() {
    uniqueAssId += 1;
    return uniqueAssId;
}

setHomeDisplay();






/*
Each Assignment:
    - Name
    - Points Earned
    - Points Available
    - Category
Each Category
    - Name
    - Percentage of Final Grade

*/

/*
    TODO
    Refresh the assignments page category selectors when weights page is changed

    Create delete feature for weights page
        = Integrate assignments page refresh feature as seen above
    Create delte feature for assignment page

    Calculator for grade value
    Input onto home page



*/

