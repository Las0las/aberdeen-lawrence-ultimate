import { prisma } from '@/lib/db';
import Link from 'next/link';

// Force dynamic rendering since this page uses database queries
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CandidatesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const query = typeof params.query === 'string' ? params.query : undefined;
  const page = typeof params.page === 'string' ? parseInt(params.page, 10) : 1;
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  
  if (status) {
    where.status = status;
  }
  
  if (query) {
    where.OR = [
      { firstName: { contains: query, mode: 'insensitive' } },
      { lastName: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
    ];
  }

  const [total, candidates] = await Promise.all([
    prisma.candidate.count({ where }),
    prisma.candidate.findMany({
      where,
      include: {
        skills: {
          include: { skill: true },
          take: 5,
        },
        _count: {
          select: { applications: true, documents: true },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Candidates</h1>
        <Link
          href="/ats/candidates/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Candidate
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <form className="flex items-center gap-4">
          <input
            type="text"
            name="query"
            defaultValue={query}
            placeholder="Search by name or email..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            name="status"
            defaultValue={status || ''}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Results Info */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {candidates.length} of {total} candidates
      </div>

      {/* Candidates List */}
      {candidates.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first candidate</p>
          <Link
            href="/ats/candidates/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + New Candidate
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((candidate) => (
            <Link
              key={candidate.id}
              href={`/ats/candidates/${candidate.id}`}
              className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {candidate.firstName} {candidate.lastName}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(candidate.status)}`}>
                      {candidate.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{candidate.email}</p>
                  {candidate.location && (
                    <p className="text-gray-500 text-sm mt-1">{candidate.location}</p>
                  )}
                  {candidate.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {candidate.skills.map((cs) => (
                        <span
                          key={cs.id}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                        >
                          {cs.skill.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{candidate._count.applications} applications</p>
                  <p>{candidate._count.documents} documents</p>
                  <p className="mt-2">
                    Added {new Date(candidate.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/ats/candidates?page=${page - 1}${status ? `&status=${status}` : ''}${query ? `&query=${query}` : ''}`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2 text-gray-600">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/ats/candidates?page=${page + 1}${status ? `&status=${status}` : ''}${query ? `&query=${query}` : ''}`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    hired: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return colors[status] || colors.active;
}
