import 'package:flutter/material.dart';
import 'package:ticket_tap/themes/gradient_background.dart';
import 'package:ticket_tap/views/passenger%20screens/profile_screen.dart';
import 'package:ticket_tap/views/passenger%20screens/qr_scanner.dart';
import 'package:ticket_tap/views/passenger%20screens/ticket_history.dart';

class PHomescreen extends StatefulWidget {
  final int initialIndex;
  const PHomescreen({super.key, this.initialIndex = 0});

  @override
  State<PHomescreen> createState() => _PHomescreenState();
}

class _PHomescreenState extends State<PHomescreen> {
  int _selectedIndex = 0;
  
  // Screens for bottom navigation
  final List<Widget> _screens = [
    SimpleQrScanner(),
    TicketHistoryScreen(),
    ProfileScreen()
  ];

  @override
  void initState() {
    super.initState();
    _selectedIndex = widget.initialIndex;
  }

  // void _onItemTapped(int index) {
  //   setState(() {
  //     _selectedIndex = index;
  //   });
  // }
  void _onItemTapped(int index) => setState(() => _selectedIndex = index);

  @override
  Widget build(BuildContext context) {
    return GradientScaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.qr_code_scanner),
            label: 'Scan QR',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history),
            label: 'History',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: Colors.blue[700],
        unselectedItemColor: Colors.grey,
        showUnselectedLabels: true,
        onTap: _onItemTapped,
      ),
    );
  }
}

// Home Dashboard Screen
// class HomeDashboard extends StatelessWidget {
//   const HomeDashboard({super.key});

//   @override
//   Widget build(BuildContext context) {
//     return SingleChildScrollView(
//       padding: EdgeInsets.all(16),
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           Text(
//             "Welcome Passenger!",
//             style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
//           ),
//           SizedBox(height: 10),
//           Text(
//             "Your ticket dashboard",
//             style: TextStyle(fontSize: 16, color: Colors.grey),
//           ),
//           SizedBox(height: 30),
          
//           // Quick Actions
//           Text(
//             "Quick Actions",
//             style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
//           ),
//           SizedBox(height: 15),
          
//           Row(
//             children: [
//               Expanded(
//                 child: ActionCard(
//                   icon: Icons.qr_code_scanner,
//                   title: "Scan QR",
//                   color: Colors.blue,
//                   onTap: () {
//                     // Navigator to QR scanner
//                   },
//                 ),
//               ),
//               SizedBox(width: 15),
//               Expanded(
//                 child: ActionCard(
//                   icon: Icons.history,
//                   title: "Ticket History",
//                   color: Colors.green,
//                   onTap: () {
//                     // Navigator to ticket history
//                   },
//                 ),
//               ),
//             ],
//           ),
//           SizedBox(height: 15),
          
//           // Recent Activity
//           Text(
//             "Recent Activity",
//             style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
//           ),
//           SizedBox(height: 15),
          
//           ActivityItem(
//             title: "Ticket Purchased",
//             subtitle: "Route 42 to Downtown",
//             time: "2 hours ago",
//             icon: Icons.confirmation_number,
//           ),
//           ActivityItem(
//             title: "QR Code Scanned",
//             subtitle: "At Central Station",
//             time: "Yesterday",
//             icon: Icons.qr_code,
//           ),
//           ActivityItem(
//             title: "Account Created",
//             subtitle: "Welcome to TicketTap",
//             time: "1 week ago",
//             icon: Icons.person_add,
//           ),
//         ],
//       ),
//     );
//   }
// }

// Action Card Widget
class ActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color color;
  final VoidCallback onTap;

  const ActionCard({
    super.key,
    required this.icon,
    required this.title,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            children: [
              Icon(icon, size: 40, color: color),
              SizedBox(height: 10),
              Text(title, style: TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ),
    );
  }
}

// Activity Item Widget
class ActivityItem extends StatelessWidget {
  final String title;
  final String subtitle;
  final String time;
  final IconData icon;

  const ActivityItem({
    super.key,
    required this.title,
    required this.subtitle,
    required this.time,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: Colors.blue),
      title: Text(title, style: TextStyle(fontWeight: FontWeight.bold)),
      subtitle: Text(subtitle),
      trailing: Text(time, style: TextStyle(fontSize: 12, color: Colors.grey)),
    );
  }
}