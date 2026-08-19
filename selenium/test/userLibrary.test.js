const { Builder, By, until } = require("selenium-webdriver");
const assert = require("assert");

describe("User Library Tests", function () {
  this.timeout(30000);

  let driver;

  before(async function () {
    driver = await new Builder().forBrowser("chrome").build();

    // Log in first since the library page requires authentication
    await driver.get("http://localhost:3000/login");

    const email = await driver.findElement(By.name("email"));
    const password = await driver.findElement(By.name("password"));
    const loginButton = await driver.findElement(By.css(".auth-submit-btn"));

    await email.sendKeys("ayeshaanis@iut-dhaka.edu");
    await password.sendKeys("Ayesha@871");
    await loginButton.click();

    await driver.wait(until.urlContains("/search"), 10000);
  });

  // TEST 1 - Library page opens

  it("should display the User Library page", async function () {
    await driver.get("http://localhost:3000/library");

    await driver.wait(until.elementsLocated(By.css(".library-item")), 5000);

    const currentUrl = await driver.getCurrentUrl();

    assert.ok(
      currentUrl.includes("/library"),
      "Should stay on the library page",
    );

    await driver.sleep(2000);
  });

  // TEST 2 - Sidebar shows "All Papers" item

  it("should display All Papers item in sidebar", async function () {
    const items = await driver.findElements(By.css(".library-item"));

    const firstItemText = await items[0].getText();

    console.log("First sidebar item:", firstItemText);

    assert.strictEqual(firstItemText, "All Papers");

    await driver.sleep(2000);
  });

  // TEST 3 - Search papers input works

  it("should allow user to type in the search papers field", async function () {
    const searchInput = await driver.findElement(
      By.css('input[placeholder="Search Papers"]'),
    );

    await searchInput.sendKeys("Deep Learning");

    await driver.sleep(2000);

    const searchValue = await searchInput.getAttribute("value");

    assert.strictEqual(searchValue, "Deep Learning");
  });

  // TEST 4 - Sort dropdown has expected option

  it("should display sort options in the dropdown", async function () {
    const option = await driver.findElement(
      By.css('.form-select option[value="dateAdded"]'),
    );

    const optionText = await option.getText();

    assert.strictEqual(optionText, "Sort by Date Added");

    await driver.sleep(2000);
  });

  // TEST 5 - BibTeX button navigates to the Bibtex page

  it("should navigate to the Bibtex page when BibTeX button is clicked", async function () {
    const bibtexButton = await driver.findElement(
      By.xpath("//button[contains(text(),'BibTeX')]"),
    );

    await bibtexButton.click();

    await driver.wait(until.urlContains("/bibtex"), 5000);

    const currentUrl = await driver.getCurrentUrl();

    console.log("Current URL:", currentUrl);

    assert.ok(currentUrl.includes("/bibtex"));

    await driver.sleep(3000);

    // Go back to the library page for the remaining tests
    await driver.get("http://localhost:3000/library");

    await driver.wait(until.elementsLocated(By.css(".library-item")), 5000);
  });

  // TEST 6 - Open New Library modal

  it("should open the New Library modal", async function () {
    const newLibraryButton = await driver.findElement(
      By.xpath("//button[contains(text(),'New Library')]"),
    );

    await newLibraryButton.click();

    const nameInput = await driver.wait(
      until.elementLocated(By.css('input[placeholder="Enter library name"]')),
      5000,
    );

    assert.ok(nameInput);

    await driver.sleep(3000);
  });

  // TEST 7 - Enter a new library name

  it("should allow user to type a new library name", async function () {
    const nameInput = await driver.findElement(
      By.css('input[placeholder="Enter library name"]'),
    );

    await nameInput.sendKeys("Selenium Test Library");

    await driver.sleep(2000);

    const nameValue = await nameInput.getAttribute("value");

    assert.strictEqual(nameValue, "Selenium Test Library");
  });

  // TEST 8 - Create button disabled when name is empty

  it("should keep Create button disabled when library name is empty", async function () {
    const nameInput = await driver.findElement(
      By.css('input[placeholder="Enter library name"]'),
    );

    await nameInput.clear();

    await driver.sleep(1000);

    const createButton = await driver.findElement(By.css("button[disabled]"));

    const isDisabled = await createButton.getAttribute("disabled");

    assert.ok(isDisabled, "Create button should be disabled for empty name");
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });
});
