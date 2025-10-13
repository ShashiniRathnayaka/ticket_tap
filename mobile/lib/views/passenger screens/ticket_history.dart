import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:ticket_tap/services/secure_storage_services.dart';

class TicketHistoryScreen extends StatefulWidget {
  const TicketHistoryScreen({super.key});

  @override
  State<TicketHistoryScreen> createState() => _TicketHistoryScreenState();
}

class _TicketHistoryScreenState extends State<TicketHistoryScreen> {
  List<dynamic> tickets = [];
  int currentPage = 1;
  bool isLoading = false;
  bool hasMore = true;
  String? userId;

  @override
  void initState() {
    super.initState();
    fetchTickets();
  }

  Future<void> fetchTickets() async {
    if (isLoading || !hasMore) return;

    setState(() => isLoading = true);

    try {
      final userData = await SecureStorageService.getUserData();
      userId = userData['userId'];
      print('Fetching tickets for user ID😊: $userId');
      final url = Uri.parse(
          'http://192.168.8.117:5000/tickets/$userId?page=$currentPage&limit=10');

      final response = await http.get(url);

      if (response.statusCode == 200) {
        final jsonData = json.decode(response.body);

        setState(() {
          tickets.addAll(jsonData['data']);
          currentPage++;
          hasMore = currentPage <= jsonData['pagination']['totalPages'];
        });
      } else {
        print('Error fetching tickets: ${response.statusCode}');
      }
    } catch (e) {
      print('Error: $e');
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text("Ticket History", style: TextStyle(color: Colors.white),),
        backgroundColor: const Color(0xFF4E1A93),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: NotificationListener<ScrollNotification>(
        onNotification: (scrollInfo) {
          if (!isLoading &&
              hasMore &&
              scrollInfo.metrics.pixels ==
                  scrollInfo.metrics.maxScrollExtent) {
            fetchTickets();
          }
          return false;
        },
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: tickets.length + (isLoading ? 1 : 0),
          itemBuilder: (context, index) {
            if (index == tickets.length) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(8.0),
                  child: CircularProgressIndicator(),
                ),
              );
            }

            final ticket = tickets[index];
            return TicketItem(
              from: ticket['start_location'] ?? 'Unknown',
              to: ticket['end_location'] ?? 'Unknown',
              date: ticket['created_at'] ?? 'Unknown Date',
              price: 'Rs. ${ticket['fare'] ?? 0}',
            );
          },
        ),
      ),
    );
  }
}

class TicketItem extends StatelessWidget {
  final String from;
  final String to;
  final String date;
  final String price;

  const TicketItem({
    super.key,
    required this.from,
    required this.to,
    required this.date,
    required this.price,
  });

  @override
  Widget build(BuildContext context) {

    // Format incoming date string into a readable format
    String formattedDate;
    try {
      // Try parse ISO8601 or common timestamp string
      final dt = DateTime.parse(date).toLocal();
      formattedDate = DateFormat('EEE, d MMM yyyy • h:mm a').format(dt);
    } catch (_) {
      // If parsing fails, just show the raw value
      formattedDate = date;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("From: $from ",
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text("To: $to",
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(formattedDate, style: const TextStyle(color: Colors.grey)),
                Text(price, style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
