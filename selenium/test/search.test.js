const { Builder, By, until } = require("selenium-webdriver");
const assert = require("assert");

describe("Search Page Tests", function () {
  this.timeout(30000);

  let driver;

  before(async function () {
    driver = await new Builder().forBrowser("chrome").build();
  });

  // TEST 1 - Search page displays heading

  it("should display the search page heading", async function () {
    await driver.get("http://localhost:3000/search");

    const heading = await driver.findElement(By.css("h1"));

    const headingText = await heading.getText();

    console.log("Heading:", headingText);

    assert.strictEqual(headingText, "Welcome to Novara");

    await driver.sleep(3000);
  });

  // TEST 2 - Search input accepts text

  it("should allow user to type a search query", async function () {
    const searchInput = await driver.findElement(
      By.css('input[placeholder="Search for articles..."]'),
    );

    await searchInput.sendKeys("Machine Learning");

    await driver.sleep(2000);

    const searchValue = await searchInput.getAttribute("value");

    assert.strictEqual(searchValue, "Machine Learning");
  });

  // TEST 3 - Submitting search navigates with query params

  it("should navigate to search results when Search is clicked", async function () {
    const searchButton = await driver.findElement(
      By.xpath("//button[contains(text(),'Search')]"),
    );

    await searchButton.click();

    await driver.wait(until.urlContains("q=Machine"), 5000);

    const currentUrl = await driver.getCurrentUrl();

    console.log("Current URL:", currentUrl);

    assert.ok(currentUrl.includes("/search?q="));

    await driver.sleep(3000);
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });
});
