import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';
import '../database/db_helper.dart';

class SyncService {
  final String _backendUrl = 'https://atlas-ops-backend.onrender.com/api/jobs/sync';
  final Uuid _uuid = const Uuid();

  /// Reads pending updates from the local SQLite sync_queue,
  /// pushes them to the backend, and clears the queue on success.
  Future<void> syncOfflineJobs() async {
    final db = await DatabaseHelper.instance.database;

    // Fetch all pending sync tasks
    final List<Map<String, dynamic>> pendingTasks = await db.query('sync_queue');

    if (pendingTasks.isEmpty) {
      print('[SyncService] No pending jobs to sync.');
      return;
    }

    print('[SyncService] Found ${pendingTasks.length} jobs to sync.');

    for (final task in pendingTasks) {
      final int queueId = task['id'];
      final String jobId = task['jobId'];
      final String status = task['status'];
      final String clientUpdatedAt = task['clientUpdatedAt'];

      // Generate a unique idempotency key for this sync attempt
      // In a real app, this might be persisted with the task so retries use the same key
      final String idempotencyKey = _uuid.v4();

      final payload = {
        'jobId': jobId,
        'status': status,
        'clientUpdatedAt': clientUpdatedAt,
      };

      try {
        final response = await http.post(
          Uri.parse(_backendUrl),
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: jsonEncode(payload),
        );

        if (response.statusCode == 200) {
          print('[SyncService] Successfully synced job $jobId.');
          // Remove the successful task from the sync queue
          await db.delete(
            'sync_queue',
            where: 'id = ?',
            whereArgs: [queueId],
          );
        } else {
          print('[SyncService] Failed to sync job $jobId. Status: ${response.statusCode}');
          print('[SyncService] Response: ${response.body}');
        }
      } catch (e) {
        print('[SyncService] Network error syncing job $jobId: $e');
        // Stop the sync loop if the network is completely unreachable
        break;
      }
    }
  }
}
