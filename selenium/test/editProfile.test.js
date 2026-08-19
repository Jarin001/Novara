const { Builder, By, until } = require("selenium-webdriver");
const assert = require("assert");

const BASE_URL = "http://localhost:3000";

const TEST_EMAIL = "afreensanjana74@gmail.com";
const TEST_PASSWORD = "Sa42106!";

const ELEMENT_TIMEOUT = 20000;


describe("Edit Profile Test", function () {

    this.timeout(120000);

    let driver;


    // ============================================================
    // LOGIN
    // ============================================================

    before(async function () {

        driver = await new Builder()
            .forBrowser("chrome")
            .build();

        await driver.get(`${BASE_URL}/login`);

        const email = await driver.wait(
            until.elementLocated(
                By.css('input[name="email"]')
            ),
            ELEMENT_TIMEOUT
        );

        const password = await driver.wait(
            until.elementLocated(
                By.css('input[name="password"]')
            ),
            ELEMENT_TIMEOUT
        );

        const loginBtn = await driver.wait(
            until.elementLocated(
                By.css('button[type="submit"]')
            ),
            ELEMENT_TIMEOUT
        );

        await email.sendKeys(TEST_EMAIL);
        await password.sendKeys(TEST_PASSWORD);

        await loginBtn.click();

        await driver.wait(
            until.urlContains("/search"),
            ELEMENT_TIMEOUT
        );

        console.log("Login successful.");
    });


    // ============================================================
    // TEST 1
    // Open Edit Profile modal
    // ============================================================

    it("should open the Edit Profile modal", async function () {

        await driver.get(`${BASE_URL}/profile`);

        // Wait for profile page to finish loading
        await driver.wait(
            until.elementLocated(
                By.css(".profile-name")
            ),
            ELEMENT_TIMEOUT
        );

        const editBtn = await driver.wait(
            until.elementLocated(
                By.xpath(
                    "//button[.//span[contains(normalize-space(), 'Edit Profile')]]"
                )
            ),
            ELEMENT_TIMEOUT
        );

        await editBtn.click();

        // EditProfileModal has the title "Edit Profile"
        const modalTitle = await driver.wait(
            until.elementLocated(
                By.css(".modal-title")
            ),
            ELEMENT_TIMEOUT
        );

        assert.strictEqual(
            await modalTitle.getText(),
            "Edit Profile"
        );

        console.log("Edit Profile modal opened.");
    });


    // ============================================================
    // TEST 2
    // Verify existing profile information
    // ============================================================

    it("should display the existing profile information", async function () {

        await driver.get(`${BASE_URL}/profile`);

        await driver.wait(
            until.elementLocated(
                By.css(".profile-name")
            ),
            ELEMENT_TIMEOUT
        );

        // Open modal
        const editBtn = await driver.wait(
            until.elementLocated(
                By.xpath(
                    "//button[.//span[contains(normalize-space(), 'Edit Profile')]]"
                )
            ),
            ELEMENT_TIMEOUT
        );

        await editBtn.click();

        // Wait for name field
        const nameInput = await driver.wait(
            until.elementLocated(
                By.css('input[name="name"]')
            ),
            ELEMENT_TIMEOUT
        );

        const name = await nameInput.getAttribute("value");

        assert.ok(
            name.trim().length > 0,
            "Name should be populated"
        );

        // Check email
        const emailInput = await driver.findElement(
            By.css('input[type="email"]')
        );

        const email = await emailInput.getAttribute("value");

        assert.ok(
            email.trim().length > 0,
            "Email should be populated"
        );

        console.log("Name:", name);
        console.log("Email:", email);
    });


    // ============================================================
    // TEST 3
    // Email should be disabled
    // ============================================================

    it("should keep the email field disabled", async function () {

        await driver.get(`${BASE_URL}/profile`);

        await driver.wait(
            until.elementLocated(
                By.css(".profile-name")
            ),
            ELEMENT_TIMEOUT
        );

        const editBtn = await driver.wait(
            until.elementLocated(
                By.xpath(
                    "//button[.//span[contains(normalize-space(), 'Edit Profile')]]"
                )
            ),
            ELEMENT_TIMEOUT
        );

        await editBtn.click();

        const emailInput = await driver.wait(
            until.elementLocated(
                By.css('input[type="email"]')
            ),
            ELEMENT_TIMEOUT
        );

        const disabled = await emailInput.getAttribute("disabled");

        assert.notStrictEqual(
            disabled,
            null,
            "Email field should be disabled"
        );

        console.log("Email field is disabled.");
    });


    // ============================================================
    // TEST 4
    // Edit affiliation
    // ============================================================

    it("should allow the user to edit their affiliation", async function () {

        await driver.get(`${BASE_URL}/profile`);

        await driver.wait(
            until.elementLocated(
                By.css(".profile-name")
            ),
            ELEMENT_TIMEOUT
        );

        const editBtn = await driver.wait(
            until.elementLocated(
                By.xpath(
                    "//button[.//span[contains(normalize-space(), 'Edit Profile')]]"
                )
            ),
            ELEMENT_TIMEOUT
        );

        await editBtn.click();

        const affiliationInput = await driver.wait(
            until.elementLocated(
                By.css('input[name="affiliation"]')
            ),
            ELEMENT_TIMEOUT
        );

        await affiliationInput.clear();

        await affiliationInput.sendKeys(
            "Islamic University of Technology"
        );

        const value = await affiliationInput.getAttribute(
            "value"
        );

        assert.strictEqual(
            value,
            "Islamic University of Technology"
        );

        console.log(
            "Affiliation changed successfully."
        );
    });


    // ============================================================
    // TEST 5
    // Add research interest
    // ============================================================

    it("should allow the user to add a research interest", async function () {

        await driver.get(`${BASE_URL}/profile`);

        await driver.wait(
            until.elementLocated(
                By.css(".profile-name")
            ),
            ELEMENT_TIMEOUT
        );

        const editBtn = await driver.wait(
            until.elementLocated(
                By.xpath(
                    "//button[.//span[contains(normalize-space(), 'Edit Profile')]]"
                )
            ),
            ELEMENT_TIMEOUT
        );

        await editBtn.click();

        const interestInput = await driver.wait(
            until.elementLocated(
                By.css(
                    'input[placeholder="Add research interest"]'
                )
            ),
            ELEMENT_TIMEOUT
        );

        await interestInput.sendKeys(
            "Software Testing"
        );

        // Click the + button beside the research interest field
        const addButton = await driver.wait(
            until.elementLocated(
                By.xpath(
                    "//input[@placeholder='Add research interest']/following-sibling::button"
                )
            ),
            ELEMENT_TIMEOUT
        );

        await addButton.click();

        // Verify the interest was added
        const addedInterest = await driver.wait(
            until.elementLocated(
                By.xpath(
                    "//*[normalize-space()='Software Testing']"
                )
            ),
            ELEMENT_TIMEOUT
        );

        assert.ok(
            await addedInterest.isDisplayed(),
            "Research interest should be displayed"
        );

        console.log(
            "Research interest added successfully."
        );
    });


    // ============================================================
    // TEST 6
    // Cancel button should close the modal
    // ============================================================

    it("should close the modal when Cancel is clicked", async function () {

        await driver.get(`${BASE_URL}/profile`);

        await driver.wait(
            until.elementLocated(
                By.css(".profile-name")
            ),
            ELEMENT_TIMEOUT
        );

        const editBtn = await driver.wait(
            until.elementLocated(
                By.xpath(
                    "//button[.//span[contains(normalize-space(), 'Edit Profile')]]"
                )
            ),
            ELEMENT_TIMEOUT
        );

        await editBtn.click();

        const modalTitle = await driver.wait(
            until.elementLocated(
                By.css(".modal-title")
            ),
            ELEMENT_TIMEOUT
        );

        assert.ok(
            await modalTitle.isDisplayed(),
            "Modal should be visible"
        );

        // Click Cancel
        const cancelBtn = await driver.wait(
            until.elementLocated(
                By.xpath(
                    "//button[normalize-space()='Cancel']"
                )
            ),
            ELEMENT_TIMEOUT
        );

        await cancelBtn.click();

        // Modal should disappear
        await driver.wait(
            until.stalenessOf(modalTitle),
            ELEMENT_TIMEOUT
        );

        console.log(
            "Edit Profile modal closed successfully."
        );
    });


    // ============================================================
    // AFTER ALL TESTS
    // ============================================================

    after(async function () {

        if (driver) {
            await driver.quit();
        }
    });

});