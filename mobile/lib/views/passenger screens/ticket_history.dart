import 'package:flutter/material.dart';

class TicketHistoryScreen extends StatelessWidget {
  const TicketHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Ticket History"),
      ),
      body: ListView(
        padding: EdgeInsets.all(16),
        children: [
          TicketItem(
            route: "Route 42 - Downtown Express",
            date: "Oct 15, 2023",
            price: "\$2.50",
            status: "Used",
          ),
          TicketItem(
            route: "Route 18 - University Line",
            date: "Oct 12, 2023",
            price: "\$1.75",
            status: "Used",
          ),
          TicketItem(
            route: "Route 7 - Beachfront",
            date: "Oct 10, 2023",
            price: "\$3.00",
            status: "Expired",
          ),
          TicketItem(
            route: "Route 42 - Downtown Express",
            date: "Oct 5, 2023",
            price: "\$2.50",
            status: "Used",
          ),
        ],
      ),
    );
  }
}

class TicketItem extends StatelessWidget {
  final String route;
  final String date;
  final String price;
  final String status;

  const TicketItem({
    super.key,
    required this.route,
    required this.date,
    required this.price,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    Color statusColor = Colors.grey;
    if (status == "Used") {
      statusColor = Colors.green;
    } else if (status == "Expired") {
      statusColor = Colors.orange;
    }

    return Card(
      margin: EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(route, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(date, style: TextStyle(color: Colors.grey)),
                Text(price, style: TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Status:"),
                Chip(
                  label: Text(status, style: TextStyle(color: Colors.white)),
                  backgroundColor: statusColor,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}