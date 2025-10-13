import 'dart:convert';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class PassengerRoutesPage extends StatefulWidget {
  const PassengerRoutesPage({super.key});

  @override
  State<PassengerRoutesPage> createState() => _PassengerRoutesPageState();
}

class _PassengerRoutesPageState extends State<PassengerRoutesPage> {
  late Future<List<dynamic>> _routesFuture;

  @override
  void initState() {
    super.initState();
    _routesFuture = fetchRoutes();
  }

  Future<List<dynamic>> fetchRoutes() async {
    final url = Uri.parse('http://192.168.8.117:5000/routes/getAllRoutes');
    final response = await http.get(url);

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      // Assuming the API returns a list like [{"route_name": ..., "start_location": ...}, ...]
      if (data is List) {
        return data;
      } else if (data is Map && data.containsKey('routes')) {
        // Sometimes APIs wrap the list in an object like { "routes": [...] }
        return data['routes'];
      } else {
        throw Exception('Unexpected API response structure');
      }
    } else {
      throw Exception('Failed to load routes (${response.statusCode})');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: Text("available_routes".tr(), style: TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFF4E1A93),
        elevation: 0,
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _routesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(
              child: Text('Error: ${snapshot.error}'),
            );
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(
              child: Text('No routes available at the moment.'),
            );
          }

          final routes = snapshot.data!;
          return ListView.builder(
            padding: const EdgeInsets.all(10),
            itemCount: routes.length,
            itemBuilder: (context, index) {
              final route = routes[index];
              final routeName = route['route_name'] ?? 'N/A';
              final start = route['start_location'] ?? '-';
              final end = route['end_location'] ?? '-';
              final distance = route['distance'] ?? 'N/A';
              final hours = route['estimated_time']?['hours'] ?? 0;
              final minutes = route['estimated_time']?['minutes'] ?? 0;

              return Card(
                elevation: 4,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: const Color(0xFF4E1A93),
                    child: Text(
                      routeName.toString(),
                      style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                  title: Text(
                    '$start → $end',
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.w600),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 4),
                      Text('Distance: $distance km'),
                      Text('Estimated time: ${hours}h ${minutes}m'),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
