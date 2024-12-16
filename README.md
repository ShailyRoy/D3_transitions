# D3 Interactive Scatter Plot and Box Plot Visualization

This project implements a dynamic **scatter plot** and an animated **box plot** using **D3.js v7**. The scatter plot supports lasso-based selection of data points, with the box plot visualizing summary statistics for the selected data points. The project also includes interactive controls for customizing the visualization based on user-selected attributes.

---

## Project Features

### **Control Panel**
A control panel allows users to configure the visualizations dynamically. It includes the following controls:
- **Dataset Selection**: Choose between available datasets (e.g., Penguins and Pokémon) or additional test datasets.
- **X Attribute**: Select the quantitative attribute to display on the scatter plot's x-axis.
- **Y Attribute**: Select the quantitative attribute to display on the scatter plot's y-axis.
- **Color**: Choose a categorical attribute to color the scatter plot points.
- **Boxplot Attribute**: Select a quantitative attribute for displaying summary statistics in the box plot.

### **Scatter Plot**
- The scatter plot visualizes the selected dataset based on the chosen X and Y attributes.
- Points are colored according to the selected categorical attribute.
- Includes labeled axes that update dynamically based on attribute selection.
- A **lasso tool** allows users to select a subset of points interactively:
  - Selected points are visually highlighted.
  - The selection triggers the box plot update.

### **Box Plot**
- Displays summary statistics (e.g., min, max, quartiles, median) for the selected points, grouped by color categories.
- Box plots are animated using **D3 transitions**:
  - Smooth transitions for updating whiskers, boxes, and outliers.
  - "Grow" and "shrink" animations when groups are added or removed.
- The box plot dynamically updates based on the selected dataset, attributes, and scatter plot lasso selection.

### **Violin Plot Toggle**
- A toggle button allows users to switch between the box plot and a **violin plot**.
- Smooth animations transform the box plot into a kernel density violin plot (or vice versa).

### **Dynamic Updates**
- The visualizations update seamlessly when:
  - The dataset or attributes are changed.
  - A new lasso selection is made in the scatter plot.
  - The plot type is toggled between box plot and violin plot.

---

## How to Use

1. **Clone the Repository**:
   ```bash
   git clone <repository-link>
   ```

2. **Run a Local Server**:
   Use a simple HTTP server to view the project locally:
   ```bash
   python3 -m http.server
   ```
   Open `index.html` in a browser.

3. **Interact with the Tool**:
   - Use the control panel to configure datasets, attributes, and colors.
   - Lasso-select points on the scatter plot to generate or update the box plot.
   - Toggle between box plot and violin plot for an alternate view of the summary statistics.

---

## Folder Structure

- **index.html**: Main HTML file for the interface.
- **shailyro.js**: JavaScript file implementing the D3 visualizations and interactions.
- **shailyro.css**: CSS file for styling the interface.
- **data/**: Folder containing datasets (`penguins_cleaned.csv`, `Pokemon.csv`, etc.).

---

## Datasets

The project currently supports two datasets:
1. **Penguins Dataset**: Contains attributes related to penguin species.
2. **Pokémon Dataset**: Includes Pokémon stats and attributes.

Additional datasets (e.g., "Test1" and "Test2") are supported dynamically when available.

---

## Visual Features

- **Scatter Plot**:
  - Dynamic axes and color coding.
  - Lasso-based selection for highlighting points.
  - Smooth transitions for attribute updates.

- **Box Plot**:
  - Grouped summary statistics for selected data.
  - Animated updates for boxes, whiskers, and outliers.

- **Violin Plot**:
  - Kernel density estimation for selected data.
  - Smooth transitions between box and violin plots.

---

## Example Screenshot

The visual interface consists of:
- A control panel at the top.
- Side-by-side scatter plot and box plot panels.
- A toggle button for switching between box and violin plots.

![Example Screenshot](imgs/interface.png)
