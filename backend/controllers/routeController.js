const client = require("../db");

// Add new route (Admin only)
exports.addRoute = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "Request body is required" });
  }

  const {
    route_name,
    start_location,
    end_location,
    distance,
    estimated_time,
    status = "ACTIVE",
  } = req.body;
  const added_by = req.user.userId;

  try {
    // Check if route name already exists
    const routeCheck = await client.query(
      "SELECT * FROM routes WHERE route_name = $1",
      [route_name]
    );
    if (routeCheck.rows.length > 0) {
      return res.status(409).json({ message: "Route name already exists" });
    }

    const result = await client.query(
      `INSERT INTO routes (route_name, start_location, end_location, distance, estimated_time, status, added_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        route_name,
        start_location,
        end_location,
        distance,
        estimated_time,
        status,
        added_by,
      ]
    );

    res.status(201).json({
      message: "Route added successfully",
      route: result.rows[0],
    });
  } catch (err) {
    console.error("Error adding route:", err);
    res.status(500).json({ message: "Error adding route" });
  }
};

// Get all routes (Admins can see all routes)
exports.getAllRoutes = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT 
        r.*,
        u.name as added_by_name
       FROM routes r
       LEFT JOIN users u ON r.added_by = u.id
       ORDER BY r.route_name`
    );

    const routes = result.rows;

    res.status(200).json({
      message: "Routes retrieved successfully",
      count: routes.length,
      routes: routes,
    });
  } catch (err) {
    console.error("Error fetching routes:", err);
    res.status(500).json({ message: "Error retrieving routes" });
  }
};

// Get route by ID
exports.getRouteById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await client.query(
      `SELECT 
        r.*,
        u.name as added_by_name
       FROM routes r
       LEFT JOIN users u ON r.added_by = u.id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Route not found" });
    }

    res.status(200).json({
      message: "Route retrieved successfully",
      route: result.rows[0],
    });
  } catch (err) {
    console.error("Error fetching route:", err);
    res.status(500).json({ message: "Error retrieving route" });
  }
};

// Update route (Only the admin who added it can update)
exports.updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      route_name,
      start_location,
      end_location,
      distance,
      estimated_time,
      status,
    } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Check if route exists and user has permission
    let checkQuery = "SELECT * FROM routes WHERE id = $1";
    let checkParams = [id];

    // Regular admins can only update their own routes
    if (userRole === "ADMIN") {
      checkQuery += " AND added_by = $2";
      checkParams.push(userId);
    }

    const checkResult = await client.query(checkQuery, checkParams);

    if (checkResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Route not found or unauthorized" });
    }

    // Check for duplicate route name (excluding current route)
    if (route_name) {
      const routeCheck = await client.query(
        "SELECT * FROM routes WHERE route_name = $1 AND id != $2",
        [route_name, id]
      );
      if (routeCheck.rows.length > 0) {
        return res.status(409).json({ message: "Route name already exists" });
      }
    }

    const result = await client.query(
      `UPDATE routes 
       SET route_name = COALESCE($1, route_name), 
           start_location = COALESCE($2, start_location), 
           end_location = COALESCE($3, end_location), 
           distance = COALESCE($4, distance), 
           estimated_time = COALESCE($5, estimated_time), 
           status = COALESCE($6, status), 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 
       RETURNING *`,
      [
        route_name,
        start_location,
        end_location,
        distance,
        estimated_time,
        status,
        id,
      ]
    );

    res.status(200).json({
      message: "Route updated successfully",
      route: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating route:", err);
    res.status(500).json({ message: "Error updating route" });
  }
};

// Delete route (Only the admin who added it can delete)
exports.deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    let query = "DELETE FROM routes WHERE id = $1";
    let queryParams = [id];

    // Regular admins can only delete their own routes
    if (userRole === "ADMIN") {
      query += " AND added_by = $2";
      queryParams.push(userId);
    }

    query += " RETURNING *";

    const result = await client.query(query, queryParams);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Route not found or unauthorized" });
    }

    res.status(200).json({
      message: "Route deleted successfully",
      route: result.rows[0],
    });
  } catch (err) {
    console.error("Error deleting route:", err);
    res.status(500).json({ message: "Error deleting route" });
  }
};
